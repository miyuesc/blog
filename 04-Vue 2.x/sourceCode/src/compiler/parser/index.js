/* @flow */

import he from 'he'
import { parseHTML } from './html-parser'
import { parseText } from './text-parser'
import { parseFilters } from './filter-parser'
import { genAssignmentCode } from '../directives/model'
import { extend, cached, no, camelize, hyphenate } from 'shared/util'
import { isIE, isEdge, isServerRendering } from 'core/util/env'

import {
  addProp,
  addAttr,
  baseWarn,
  addHandler,
  addDirective,
  getBindingAttr,
  getAndRemoveAttr,
  getRawBindingAttr,
  pluckModuleFunction,
  getAndRemoveAttrByRegex
} from '../helpers'

export const onRE = /^@|^v-on:/
export const dirRE = process.env.VBIND_PROP_SHORTHAND
  ? /^v-|^@|^:|^\.|^#/
  : /^v-|^@|^:|^#/
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g
const dynamicArgRE = /^\[.*\]$/

const argRE = /:(.*)$/
export const bindRE = /^:|^\.|^v-bind:/
const propBindRE = /^\./
const modifierRE = /\.[^.\]]+(?=[^\]]*$)/g

const slotRE = /^v-slot(:|$)|^#/

const lineBreakRE = /[\r\n]/
const whitespaceRE = /\s+/g

const invalidAttributeRE = /[\s"'<>\/=]/

const decodeHTMLCached = cached(he.decode)

export const emptySlotScopeToken = `_empty_`

// configurable state
export let warn: any
let delimiters
let transforms
let preTransforms
let postTransforms
let platformIsPreTag
let platformMustUseProp
let platformGetTagNamespace
let maybeComponent

/**
 * 为指定元素创建 AST 对象
 * @param {*} tag 标签名
 * @param {*} attrs 属性数组，[{ name: attrName, value: attrVal, start, end }, ...]
 * @param {*} parent 父元素
 * @returns { type: 1, tag, attrsList, attrsMap: makeAttrsMap(attrs), rawAttrsMap: {}, parent, children: []}
 */
export function createASTElement(
  tag: string,
  attrs: Array<ASTAttr>,
  parent: ASTElement | void
): ASTElement {
  return {
    // 节点类型
    type: 1,
    // 标签名
    tag,
    // 标签的属性数组
    attrsList: attrs,
    // 标签的属性对象 { attrName: attrVal, ... }
    attrsMap: makeAttrsMap(attrs),
    // 原始属性对象
    rawAttrsMap: {},
    // 父节点
    parent,
    // 孩子节点
    children: []
  }
}

/**
 * 
 * 将 HTML 字符串转换为 AST
 * @param {*} template HTML 模版
 * @param {*} options 平台特有的编译选项
 * @returns root
 */
export function parse(
  template: string,
  options: CompilerOptions
): ASTElement | void {
  // 日志
  warn = options.warn || baseWarn

  // 是否为 pre 标签
  platformIsPreTag = options.isPreTag || no
  // 必须使用 props 的属性
  platformMustUseProp = options.mustUseProp || no
  // 获取标签的命名空间
  platformGetTagNamespace = options.getTagNamespace || no
  // 是否是保留标签（html + svg)
  const isReservedTag = options.isReservedTag || no
  // 判断一个元素是否为一个组件
  maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag)

  // 分别获取 options.modules 下的 class、model、style 三个模块中的 transformNode、preTransformNode、postTransformNode 方法
  // 负责处理元素节点上的 class、style、v-model
  transforms = pluckModuleFunction(options.modules, 'transformNode')
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

  // 界定符，比如: {{}}
  delimiters = options.delimiters

  const stack = []
  // 空格选项
  const preserveWhitespace = options.preserveWhitespace !== false
  const whitespaceOption = options.whitespace
  // 根节点，以 root 为根，处理后的节点都会按照层级挂载到 root 下，最后 return 的就是 root，一个 ast 语法树
  let root
  // 当前元素的父元素
  let currentParent
  let inVPre = false
  let inPre = false
  let warned = false

  // 只记录一个日志的方法
  function warnOnce(msg, range) {
    if (!warned) {
      warned = true
      warn(msg, range)
    }
  }

  /**
   * 主要做了 3 件事：
   *   1、如果元素没有被处理过，即 el.processed 为 false，则调用 processElement 方法处理节点上的众多属性
   *   2、让自己和父元素产生关系，将自己放到父元素的 children 数组中，并设置自己的 parent 属性为 currentParent
   *   3、设置自己的子元素，将自己所有非插槽的子元素放到自己的 children 数组中
   */
  function closeElement(element) {
    // 移除节点末尾的空格，当前 pre 标签内的元素除外
    trimEndingWhitespace(element)
    // 当前元素不再 pre 节点内，并且也没有被处理过
    if (!inVPre && !element.processed) {
      // 分别处理元素节点的 key、ref、插槽、自闭合的 slot 标签、动态组件、class、style、v-bind、v-on、其它指令和一些原生属性 
      element = processElement(element, options)
    }
    // 处理根节点上存在 v-if、v-else-if、v-else 指令的情况
    // 如果根节点存在 v-if 指令，则必须还提供一个具有 v-else-if 或者 v-else 的同级别节点，防止根元素不存在
    // tree management
    if (!stack.length && element !== root) {
      // allow root elements with v-if, v-else-if and v-else
      if (root.if && (element.elseif || element.else)) {
        if (process.env.NODE_ENV !== 'production') {
          // 检查根元素
          checkRootConstraints(element)
        }
        // 给根元素设置 ifConditions 属性，root.ifConditions = [{ exp: element.elseif, block: element }, ...]
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        })
      } else if (process.env.NODE_ENV !== 'production') {
        // 提示，表示不应该在 根元素 上只使用 v-if，应该将 v-if、v-else-if 一起使用，保证组件只有一个根元素
        warnOnce(
          `Component template should contain exactly one root element. ` +
          `If you are using v-if on multiple elements, ` +
          `use v-else-if to chain them instead.`,
          { start: element.start }
        )
      }
    }
    // 让自己和父元素产生关系
    // 将自己放到父元素的 children 数组中，然后设置自己的 parent 属性为 currentParent
    if (currentParent && !element.forbidden) {
      if (element.elseif || element.else) {
        processIfConditions(element, currentParent)
      } else {
        if (element.slotScope) {
          // scoped slot
          // keep it in the children list so that v-else(-if) conditions can
          // find it as the prev node.
          const name = element.slotTarget || '"default"'
            ; (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
        }
        currentParent.children.push(element)
        element.parent = currentParent
      }
    }

    // 设置自己的子元素
    // 将自己的所有非插槽的子元素设置到 element.children 数组中
    // final children cleanup
    // filter out scoped slots
    element.children = element.children.filter(c => !(c: any).slotScope)
    // remove trailing whitespace node again
    trimEndingWhitespace(element)

    // check pre state
    if (element.pre) {
      inVPre = false
    }
    if (platformIsPreTag(element.tag)) {
      inPre = false
    }
    // 分别为 element 执行 model、class、style 三个模块的 postTransform 方法
    // 但是 web 平台没有提供该方法
    // apply post-transforms
    for (let i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options)
    }
  }

  /**
   * 删除元素中空白的文本节点，比如：<div> </div>，删除 div 元素中的空白节点，将其从元素的 children 属性中移出去
   */
  function trimEndingWhitespace(el) {
    if (!inPre) {
      let lastNode
      while (
        (lastNode = el.children[el.children.length - 1]) &&
        lastNode.type === 3 &&
        lastNode.text === ' '
      ) {
        el.children.pop()
      }
    }
  }

  /**
   * 检查根元素：
   *   不能使用 slot 和 template 标签作为组件的根元素
   *   不能在有状态组件的 根元素 上使用 v-for 指令，因为它会渲染出多个元素
   * @param {*} el 
   */
  function checkRootConstraints(el) {
    // 不能使用 slot 和 template 标签作为组件的根元素
    if (el.tag === 'slot' || el.tag === 'template') {
      warnOnce(
        `Cannot use <${el.tag}> as component root element because it may ` +
        'contain multiple nodes.',
        { start: el.start }
      )
    }
    // 不能在有状态组件的 根元素 上使用 v-for，因为它会渲染出多个元素
    if (el.attrsMap.hasOwnProperty('v-for')) {
      warnOnce(
        'Cannot use v-for on stateful component root element because ' +
        'it renders multiple elements.',
        el.rawAttrsMap['v-for']
      )
    }
  }

  parseHTML(template, {
    // 日志
    warn,
    expectHTML: options.expectHTML,
    // 是否为自闭合标签
    isUnaryTag: options.isUnaryTag,
    // 可以只写开始标签的标签
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    // 应该解码换行符
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    // 应该解码 href 属性的换行符
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    // 是否保留注释
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    /**
     * 主要做了以下 6 件事情:
     *   1、创建 AST 对象
     *   2、处理存在 v-model 指令的 input 标签，分别处理 input 为 checkbox、radio、其它的情况
     *   3、处理标签上的众多指令，比如 v-pre、v-for、v-if、v-once
     *   4、如果根节点 root 不存在则设置当前元素为根节点
     *   5、如果当前元素为非自闭合标签则将自己 push 到 stack 数组，并记录 currentParent，在接下来处理子元素时用来告诉子元素自己的父节点是谁
     *   6、如果当前元素为自闭合标签，则表示该标签要处理结束了，让自己和父元素产生关系，以及设置自己的子元素
     * @param {*} tag 标签名
     * @param {*} attrs [{ name: attrName, value: attrVal, start, end }, ...] 形式的属性数组
     * @param {*} unary 自闭合标签
     * @param {*} start 标签在 html 字符串中的开始索引
     * @param {*} end 标签在 html 字符串中的结束索引
     */
    start(tag, attrs, unary, start, end) {
      // 检查命名空间，如果存在，则继承父命名空间
      // check namespace.
      // inherit parent ns if there is one
      const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }

      // 创建当前标签的 AST 对象
      let element: ASTElement = createASTElement(tag, attrs, currentParent)
      // 设置命名空间
      if (ns) {
        element.ns = ns
      }

      // 这段在非生产环境下会走，在 ast 对象上添加 一些 属性，比如 start、end
      if (process.env.NODE_ENV !== 'production') {
        if (options.outputSourceRange) {
          element.start = start
          element.end = end
          // 将属性数组解析成 { attrName: { name: attrName, value: attrVal, start, end }, ... } 形式的对象
          element.rawAttrsMap = element.attrsList.reduce((cumulated, attr) => {
            cumulated[attr.name] = attr
            return cumulated
          }, {})
        }
        // 验证属性是否有效，比如属性名不能包含: spaces, quotes, <, >, / or =.
        attrs.forEach(attr => {
          if (invalidAttributeRE.test(attr.name)) {
            warn(
              `Invalid dynamic argument expression: attribute names cannot contain ` +
              `spaces, quotes, <, >, / or =.`,
              {
                start: attr.start + attr.name.indexOf(`[`),
                end: attr.start + attr.name.length
              }
            )
          }
        })
      }

      // 非服务端渲染的情况下，模版中不应该出现 style、script 标签
      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true
        process.env.NODE_ENV !== 'production' && warn(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          `<${tag}>` + ', as they will not be parsed.',
          { start: element.start }
        )
      }

      /**
       * 为 element 对象分别执行 class、style、model 模块中的 preTransforms 方法
       * 不过 web 平台只有 model 模块有 preTransforms 方法
       * 用来处理存在 v-model 的 input 标签，但没处理 v-model 属性
       * 分别处理了 input 为 checkbox、radio 和 其它的情况
       * input 具体是哪种情况由 el.ifConditions 中的条件来判断
       * <input v-mode="test" :type="checkbox or radio or other(比如 text)" />
       */
      // apply pre-transforms
      for (let i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element
      }

      if (!inVPre) {
        // 表示 element 是否存在 v-pre 指令，存在则设置 element.pre = true
        processPre(element)
        if (element.pre) {
          // 存在 v-pre 指令，则设置 inVPre 为 true
          inVPre = true
        }
      }
      // 如果 pre 标签，则设置 inPre 为 true
      if (platformIsPreTag(element.tag)) {
        inPre = true
      }

      if (inVPre) {
        // 说明标签上存在 v-pre 指令，这样的节点只会渲染一次，将节点上的属性都设置到 el.attrs 数组对象中，作为静态属性，数据更新时不会渲染这部分内容
        // 设置 el.attrs 数组对象，每个元素都是一个属性对象 { name: attrName, value: attrVal, start, end }
        processRawAttrs(element)
      } else if (!element.processed) {
        // structural directives
        // 处理 v-for 属性，得到 element.for = 可迭代对象 element.alias = 别名
        processFor(element)
        /**
         * 处理 v-if、v-else-if、v-else
         * 得到 element.if = "exp"，element.elseif = exp, element.else = true
         * v-if 属性会额外在 element.ifConditions 数组中添加 { exp, block } 对象
         */
        processIf(element)
        // 处理 v-once 指令，得到 element.once = true 
        processOnce(element)
      }

      // 如果 root 不存在，则表示当前处理的元素为第一个元素，即组件的 根 元素
      if (!root) {
        root = element
        if (process.env.NODE_ENV !== 'production') {
          // 检查根元素，对根元素有一些限制，比如：不能使用 slot 和 template 作为根元素，也不能在有状态组件的根元素上使用 v-for 指令
          checkRootConstraints(root)
        }
      }

      if (!unary) {
        // 非自闭合标签，通过 currentParent 记录当前元素，下一个元素在处理的时候，就知道自己的父元素是谁
        currentParent = element
        // 然后将 element push 到 stack 数组，将来处理到当前元素的闭合标签时再拿出来
        // 将当前标签的 ast 对象 push 到 stack 数组中，这里需要注意，在调用 options.start 方法
        // 之前也发生过一次 push 操作，那个 push 进来的是当前标签的一个基本配置信息
        stack.push(element)
      } else {
        /**
         * 说明当前元素为自闭合标签，主要做了 3 件事：
         *   1、如果元素没有被处理过，即 el.processed 为 false，则调用 processElement 方法处理节点上的众多属性
         *   2、让自己和父元素产生关系，将自己放到父元素的 children 数组中，并设置自己的 parent 属性为 currentParent
         *   3、设置自己的子元素，将自己所有非插槽的子元素放到自己的 children 数组中
         */
        closeElement(element)
      }
    },

    /**
     * 处理结束标签
     * @param {*} tag 结束标签的名称
     * @param {*} start 结束标签的开始索引
     * @param {*} end 结束标签的结束索引
     */
    end(tag, start, end) {
      // 结束标签对应的开始标签的 ast 对象
      const element = stack[stack.length - 1]
      // pop stack
      stack.length -= 1
      // 这块儿有点不太理解，因为上一个元素有可能是当前元素的兄弟节点
      currentParent = stack[stack.length - 1]
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.end = end
      }
      /**
       * 主要做了 3 件事：
       *   1、如果元素没有被处理过，即 el.processed 为 false，则调用 processElement 方法处理节点上的众多属性
       *   2、让自己和父元素产生关系，将自己放到父元素的 children 数组中，并设置自己的 parent 属性为 currentParent
       *   3、设置自己的子元素，将自己所有非插槽的子元素放到自己的 children 数组中
       */
      closeElement(element)
    },

    /**
     * 处理文本，基于文本生成 ast 对象，然后将该 ast 放到它的父元素的肚子里，即 currentParent.children 数组中 
     */
    chars(text: string, start: number, end: number) {
      // 异常处理，currentParent 不存在说明这段文本没有父元素
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) { // 文本不能作为组件的根元素
            warnOnce(
              'Component template requires a root element, rather than just text.',
              { start }
            )
          } else if ((text = text.trim())) { // 放在根元素之外的文本会被忽略
            warnOnce(
              `text "${text}" outside root element will be ignored.`,
              { start }
            )
          }
        }
        return
      }
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      // 当前父元素的所有孩子节点
      const children = currentParent.children
      // 对 text 进行一系列的处理，比如删除空白字符，或者存在 whitespaceOptions 选项，则 text 直接置为空或者空格
      if (inPre || text.trim()) {
        // 文本在 pre 标签内 或者 text.trim() 不为空
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
      } else if (!children.length) {
        // 说明文本不在 pre 标签内而且 text.trim() 为空，而且当前父元素也没有孩子节点，
        // 则将 text 置为空
        // remove the whitespace-only node right after an opening tag
        text = ''
      } else if (whitespaceOption) {
        // 压缩处理
        if (whitespaceOption === 'condense') {
          // in condense mode, remove the whitespace node if it contains
          // line break, otherwise condense to a single space
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        text = preserveWhitespace ? ' ' : ''
      }
      // 如果经过处理后 text 还存在
      if (text) {
        if (!inPre && whitespaceOption === 'condense') {
          // 不在 pre 节点中，并且配置选项中存在压缩选项，则将多个连续空格压缩为单个
          // condense consecutive whitespaces into single space
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        // 基于 text 生成 AST 对象
        let child: ?ASTNode
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          // 文本中存在表达式（即有界定符）
          child = {
            type: 2,
            // 表达式
            expression: res.expression,
            tokens: res.tokens,
            // 文本
            text
          }
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          // 纯文本节点
          child = {
            type: 3,
            text
          }
        }
        // child 存在，则将 child 放到父元素的肚子里，即 currentParent.children 数组中
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start
            child.end = end
          }
          children.push(child)
        }
      }
    },
    /**
     * 处理注释节点
     */
    comment(text: string, start, end) {
      // adding anything as a sibling to the root node is forbidden
      // comments should still be allowed, but ignored
      // 禁止将任何内容作为 root 的节点的同级进行添加，注释应该被允许，但是会被忽略
      // 如果 currentParent 不存在，说明注释和 root 为同级，忽略
      if (currentParent) {
        // 注释节点的 ast
        const child: ASTText = {
          // 节点类型
          type: 3,
          // 注释内容
          text,
          // 是否为注释
          isComment: true
        }
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // 记录节点的开始索引和结束索引
          child.start = start
          child.end = end
        }
        // 将当前注释节点放到父元素的 children 属性中
        currentParent.children.push(child)
      }
    }
  })

  // 返回生成的 ast 对象
  return root
}

/**
 * 如果元素上存在 v-pre 指令，则设置 el.pre = true 
 */
function processPre(el) {
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true
  }
}

/**
 * 设置 el.attrs 数组对象，每个元素都是一个属性对象 { name: attrName, value: attrVal, start, end }
 */
function processRawAttrs(el) {
  const list = el.attrsList
  const len = list.length
  if (len) {
    const attrs: Array<ASTAttr> = el.attrs = new Array(len)
    for (let i = 0; i < len; i++) {
      attrs[i] = {
        name: list[i].name,
        value: JSON.stringify(list[i].value)
      }
      if (list[i].start != null) {
        attrs[i].start = list[i].start
        attrs[i].end = list[i].end
      }
    }
  } else if (!el.pre) {
    // non root node in pre blocks with no attributes
    el.plain = true
  }
}

/**
 * 分别处理元素节点的 key、ref、插槽、自闭合的 slot 标签、动态组件、class、style、v-bind、v-on、其它指令和一些原生属性 
 * 然后在 el 对象上添加如下属性：
 * el.key、ref、refInFor、scopedSlot、slotName、component、inlineTemplate、staticClass
 * el.bindingClass、staticStyle、bindingStyle、attrs
 * @param {*} element 被处理元素的 ast 对象
 * @param {*} options 配置项
 * @returns 
 */
export function processElement(
  element: ASTElement,
  options: CompilerOptions
) {
  // el.key = val
  processKey(element)

  // 确定 element 是否为一个普通元素
  // determine whether this is a plain element after
  // removing structural attributes
  element.plain = (
    !element.key &&
    !element.scopedSlots &&
    !element.attrsList.length
  )

  // el.ref = val, el.refInFor = boolean
  processRef(element)
  // 处理作为插槽传递给组件的内容，得到  插槽名称、是否为动态插槽、作用域插槽的值，以及插槽中的所有子元素，子元素放到插槽对象的 children 属性中
  processSlotContent(element)
  // 处理自闭合的 slot 标签，得到插槽名称 => el.slotName = xx
  processSlotOutlet(element)
  // 处理动态组件，<component :is="compoName"></component>得到 el.component = compName，
  // 以及标记是否存在内联模版，el.inlineTemplate = true of false
  processComponent(element)
  // 为 element 对象分别执行 class、style、model 模块中的 transformNode 方法
  // 不过 web 平台只有 class、style 模块有 transformNode 方法，分别用来处理 class 属性和 style 属性
  // 得到 el.staticStyle、 el.styleBinding、el.staticClass、el.classBinding
  // 分别存放静态 style 属性的值、动态 style 属性的值，以及静态 class 属性的值和动态 class 属性的值
  for (let i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element
  }
  /**
   * 处理元素上的所有属性：
   * v-bind 指令变成：el.attrs 或 el.dynamicAttrs = [{ name, value, start, end, dynamic }, ...]，
   *                或者是必须使用 props 的属性，变成了 el.props = [{ name, value, start, end, dynamic }, ...]
   * v-on 指令变成：el.events 或 el.nativeEvents = { name: [{ value, start, end, modifiers, dynamic }, ...] }
   * 其它指令：el.directives = [{name, rawName, value, arg, isDynamicArg, modifier, start, end }, ...]
   * 原生属性：el.attrs = [{ name, value, start, end }]，或者一些必须使用 props 的属性，变成了：
   *         el.props = [{ name, value: true, start, end, dynamic }]
   */
  processAttrs(element)
  return element
}

/**
 * 处理元素上的 key 属性，设置 el.key = val
 * @param {*} el 
 */
function processKey(el) {
  // 拿到 key 的属性值
  const exp = getBindingAttr(el, 'key')
  if (exp) {
    // 关于 key 使用上的异常处理
    if (process.env.NODE_ENV !== 'production') {
      // template 标签不允许设置 key
      if (el.tag === 'template') {
        warn(
          `<template> cannot be keyed. Place the key on real elements instead.`,
          getRawBindingAttr(el, 'key')
        )
      }
      // 不要在 <transition=group> 的子元素上使用 v-for 的 index 作为 key，这和没用 key 没什么区别
      if (el.for) {
        const iterator = el.iterator2 || el.iterator1
        const parent = el.parent
        if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
          warn(
            `Do not use v-for index as key on <transition-group> children, ` +
            `this is the same as not using keys.`,
            getRawBindingAttr(el, 'key'),
            true /* tip */
          )
        }
      }
    }
    // 设置 el.key = exp
    el.key = exp
  }
}

/**
 * 处理元素上的 ref 属性
 *  el.ref = refVal
 *  el.refInFor = boolean
 * @param {*} el 
 */
function processRef(el) {
  const ref = getBindingAttr(el, 'ref')
  if (ref) {
    el.ref = ref
    // 判断包含 ref 属性的元素是否包含在具有 v-for 指令的元素内或后代元素中
    // 如果是，则 ref 指向的则是包含 DOM 节点或组件实例的数组
    el.refInFor = checkInFor(el)
  }
}

/**
 * 处理 v-for，将结果设置到 el 对象上，得到:
 *   el.for = 可迭代对象，比如 arr
 *   el.alias = 别名，比如 item
 * @param {*} el 元素的 ast 对象
 */
export function processFor(el: ASTElement) {
  let exp
  // 获取 el 上的 v-for 属性的值
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    // 解析 v-for 的表达式，得到 { for: 可迭代对象， alias: 别名 }，比如 { for: arr, alias: item }
    const res = parseFor(exp)
    if (res) {
      // 将 res 对象上的属性拷贝到 el 对象上
      extend(el, res)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(
        `Invalid v-for expression: ${exp}`,
        el.rawAttrsMap['v-for']
      )
    }
  }
}

type ForParseResult = {
  for: string;
  alias: string;
  iterator1?: string;
  iterator2?: string;
};

/**
 * 解析 v-for 表达式的值，得到 { for: 可迭代对象（比如 arr）, alias: 别名（比如 item）}
 * @param {*} exp = "item in arr"
 */
export function parseFor(exp: string): ?ForParseResult {
  // 检查表达式是中是否存在 of 或 in
  // 即 <div v-for="item of arr" /> 或 <tag v-for="item in obj" />
  // inMatch = ["item in arr", "item", "arr", groups: undefined, index: 0, input: "item in arr"]
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return
  debugger
  const res = {}
  // res.for = 可迭代的对象，比如 arr
  res.for = inMatch[2].trim()
  // 别名，比如 item
  const alias = inMatch[1].trim().replace(stripParensRE, '')
  // 别名仍是迭代器的情况
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim()
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    // res.alias = alias，比如 item
    res.alias = alias
  }
  return res
}

/**
 * 处理 v-if、v-else-if、v-else
 * 得到 el.if = "exp"，el.elseif = exp, el.else = true
 * v-if 属性会额外在 el.ifConditions 数组中添加 { exp, block } 对象
 */
function processIf(el) {
  // 获取 v-if 属性的值，比如 <div v-if="test"></div>
  const exp = getAndRemoveAttr(el, 'v-if')
  if (exp) {
    // el.if = "test"
    el.if = exp
    // 在 el.ifConditions 数组中添加 { exp, block }
    addIfCondition(el, {
      exp: exp,
      block: el
    })
  } else {
    // 处理 v-else，得到 el.else = true
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true
    }
    // 处理 v-else-if，得到 el.elseif = exp
    const elseif = getAndRemoveAttr(el, 'v-else-if')
    if (elseif) {
      el.elseif = elseif
    }
  }
}

function processIfConditions(el, parent) {
  // 找到 parent.children 中的最后一个元素节点
  const prev = findPrevElement(parent.children)
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    })
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `v-${el.elseif ? ('else-if="' + el.elseif + '"') : 'else'} ` +
      `used on element <${el.tag}> without corresponding v-if.`,
      el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
    )
  }
}

/**
 * 找到 children 中的最后一个元素节点 
 */
function findPrevElement(children: Array<any>): ASTElement | void {
  let i = children.length
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      if (process.env.NODE_ENV !== 'production' && children[i].text !== ' ') {
        warn(
          `text "${children[i].text.trim()}" between v-if and v-else(-if) ` +
          `will be ignored.`,
          children[i]
        )
      }
      children.pop()
    }
  }
}

/**
 * 将传递进来的条件对象放进 el.ifConditions 数组中
 */
export function addIfCondition(el: ASTElement, condition: ASTIfCondition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}

/**
 * 处理 v-once 指令，得到 el.once = true
 * @param {*} el 
 */
function processOnce(el) {
  const once = getAndRemoveAttr(el, 'v-once')
  if (once != null) {
    el.once = true
  }
}

/**
 * 处理作为插槽传递给组件的内容，得到：
 *  slotTarget => 插槽名
 *  slotTargetDynamic => 是否为动态插槽
 *  slotScope => 作用域插槽的值
 *  直接在 <comp> 标签上使用 v-slot 语法时，将上述属性放到 el.scopedSlots 对象上，其它情况直接放到 el 对象上
 * handle content being passed to a component as slot,
 * e.g. <template slot="xxx">, <div slot-scope="xxx">
 */
function processSlotContent(el) {
  let slotScope
  if (el.tag === 'template') {
    // template 标签上使用 scope 属性的提示
    // scope 已经弃用，并在 2.5 之后使用 slot-scope 代替
    // slot-scope 即可以用在 template 标签也可以用在普通标签上
    slotScope = getAndRemoveAttr(el, 'scope')
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && slotScope) {
      warn(
        `the "scope" attribute for scoped slots have been deprecated and ` +
        `replaced by "slot-scope" since 2.5. The new "slot-scope" attribute ` +
        `can also be used on plain elements in addition to <template> to ` +
        `denote scoped slots.`,
        el.rawAttrsMap['scope'],
        true
      )
    }
    // el.slotScope = val
    el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')
  } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && el.attrsMap['v-for']) {
      // 元素不能同时使用 slot-scope 和 v-for，v-for 具有更高的优先级
      // 应该用 template 标签作为容器，将 slot-scope 放到 template 标签上 
      warn(
        `Ambiguous combined usage of slot-scope and v-for on <${el.tag}> ` +
        `(v-for takes higher priority). Use a wrapper <template> for the ` +
        `scoped slot to make it clearer.`,
        el.rawAttrsMap['slot-scope'],
        true
      )
    }
    el.slotScope = val
    el.slotScope = slotScope
  }

  // 获取 slot 属性的值
  // slot="xxx"，老旧的具名插槽的写法
  const slotTarget = getBindingAttr(el, 'slot')
  if (slotTarget) {
    // el.slotTarget = 插槽名（具名插槽）
    el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
    // 动态插槽名
    el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot'])
    // preserve slot as an attribute for native shadow DOM compat
    // only for non-scoped slots.
    if (el.tag !== 'template' && !el.slotScope) {
      addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'))
    }
  }

  // 2.6 v-slot syntax
  if (process.env.NEW_SLOT_SYNTAX) {
    if (el.tag === 'template') {
      // v-slot 在 tempalte 标签上，得到 v-slot 的值
      // v-slot on <template>
      const slotBinding = getAndRemoveAttrByRegex(el, slotRE)
      if (slotBinding) {
        // 异常提示
        if (process.env.NODE_ENV !== 'production') {
          if (el.slotTarget || el.slotScope) {
            // 不同插槽语法禁止混合使用
            warn(
              `Unexpected mixed usage of different slot syntaxes.`,
              el
            )
          }
          if (el.parent && !maybeComponent(el.parent)) {
            // <template v-slot> 只能出现在组件的根位置，比如：
            // <comp>
            //   <template v-slot>xx</template>
            // </comp>
            // 而不能是
            // <comp>
            //   <div>
            //     <template v-slot>xxx</template>
            //   </div>
            // </comp>
            warn(
              `<template v-slot> can only appear at the root level inside ` +
              `the receiving component`,
              el
            )
          }
        }
        // 得到插槽名称
        const { name, dynamic } = getSlotName(slotBinding)
        // 插槽名
        el.slotTarget = name
        // 是否为动态插槽
        el.slotTargetDynamic = dynamic
        // 作用域插槽的值
        el.slotScope = slotBinding.value || emptySlotScopeToken // force it into a scoped slot for perf
      }
    } else {
      // 处理组件上的 v-slot，<comp v-slot:header />
      // slotBinding = { name: "v-slot:header", value: "", start, end}
      // v-slot on component, denotes default slot
      const slotBinding = getAndRemoveAttrByRegex(el, slotRE)
      if (slotBinding) {
        // 异常提示
        if (process.env.NODE_ENV !== 'production') {
          // el 不是组件的话，提示，v-slot 只能出现在组件上或 template 标签上
          if (!maybeComponent(el)) {
            warn(
              `v-slot can only be used on components or <template>.`,
              slotBinding
            )
          }
          // 语法混用
          if (el.slotScope || el.slotTarget) {
            warn(
              `Unexpected mixed usage of different slot syntaxes.`,
              el
            )
          }
          // 为了避免作用域歧义，当存在其他命名槽时，默认槽也应该使用<template>语法
          if (el.scopedSlots) {
            warn(
              `To avoid scope ambiguity, the default slot should also use ` +
              `<template> syntax when there are other named slots.`,
              slotBinding
            )
          }
        }
        // 将组件的孩子添加到它的默认插槽内
        // add the component's children to its default slot
        const slots = el.scopedSlots || (el.scopedSlots = {})
        // 获取插槽名称以及是否为动态插槽
        const { name, dynamic } = getSlotName(slotBinding)
        // 创建一个 template 标签的 ast 对象，用于容纳插槽内容，父级是 el
        const slotContainer = slots[name] = createASTElement('template', [], el)
        // 插槽名
        slotContainer.slotTarget = name
        // 是否为动态插槽
        slotContainer.slotTargetDynamic = dynamic
        // 所有的孩子，将每一个孩子的 parent 属性都设置为 slotContainer
        slotContainer.children = el.children.filter((c: any) => {
          if (!c.slotScope) {
            // 给插槽内元素设置 parent 属性为 slotContainer，也就是 template 元素
            c.parent = slotContainer
            return true
          }
        })
        slotContainer.slotScope = slotBinding.value || emptySlotScopeToken
        // remove children as they are returned from scopedSlots now
        el.children = []
        // mark el non-plain so data gets generated
        el.plain = false
      }
    }
  }
}

/**
 * 解析 binding，得到插槽名称以及是否为动态插槽
 * @returns { name: 插槽名称, dynamic: 是否为动态插槽 }
 */
function getSlotName(binding) {
  let name = binding.name.replace(slotRE, '')
  if (!name) {
    if (binding.name[0] !== '#') {
      name = 'default'
    } else if (process.env.NODE_ENV !== 'production') {
      warn(
        `v-slot shorthand syntax requires a slot name.`,
        binding
      )
    }
  }
  return dynamicArgRE.test(name)
    // dynamic [name]
    ? { name: name.slice(1, -1), dynamic: true }
    // static name
    : { name: `"${name}"`, dynamic: false }
}

// handle <slot/> outlets，处理自闭合 slot 标签
// 得到插槽名称，el.slotName
function processSlotOutlet(el) {
  if (el.tag === 'slot') {
    // 得到插槽名称
    el.slotName = getBindingAttr(el, 'name')
    // 提示信息，不要在 slot 标签上使用 key 属性
    if (process.env.NODE_ENV !== 'production' && el.key) {
      warn(
        `\`key\` does not work on <slot> because slots are abstract outlets ` +
        `and can possibly expand into multiple elements. ` +
        `Use the key on a wrapping element instead.`,
        getRawBindingAttr(el, 'key')
      )
    }
  }
}

/**
 * 处理动态组件，<component :is="compName"></component>
 * 得到 el.component = compName
 */
function processComponent(el) {
  let binding
  // 解析 is 属性，得到属性值，即组件名称，el.component = compName
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding
  }
  // <component :is="compName" inline-template>xx</component>
  // 组件上存在 inline-template 属性，进行标记：el.inlineTemplate = true
  // 表示组件开始和结束标签内的内容作为组件模版出现，而不是作为插槽别分发，方便定义组件模版
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true
  }
}

/**
 * 处理元素上的所有属性：
 * v-bind 指令变成：el.attrs 或 el.dynamicAttrs = [{ name, value, start, end, dynamic }, ...]，
 *                或者是必须使用 props 的属性，变成了 el.props = [{ name, value, start, end, dynamic }, ...]
 * v-on 指令变成：el.events 或 el.nativeEvents = { name: [{ value, start, end, modifiers, dynamic }, ...] }
 * 其它指令：el.directives = [{name, rawName, value, arg, isDynamicArg, modifier, start, end }, ...]
 * 原生属性：el.attrs = [{ name, value, start, end }]，或者一些必须使用 props 的属性，变成了：
 *         el.props = [{ name, value: true, start, end, dynamic }]
 */
function processAttrs(el) {
  // list = [{ name, value, start, end }, ...]
  const list = el.attrsList
  let i, l, name, rawName, value, modifiers, syncGen, isDynamic
  for (i = 0, l = list.length; i < l; i++) {
    // 属性名
    name = rawName = list[i].name
    // 属性值
    value = list[i].value
    if (dirRE.test(name)) {
      // 说明该属性是一个指令

      // 元素上存在指令，将元素标记动态元素
      // mark element as dynamic
      el.hasBindings = true
      // modifiers，在属性名上解析修饰符，比如 xx.lazy
      modifiers = parseModifiers(name.replace(dirRE, ''))
      // support .foo shorthand syntax for the .prop modifier
      if (process.env.VBIND_PROP_SHORTHAND && propBindRE.test(name)) {
        // 为 .props 修饰符支持 .foo 速记写法
        (modifiers || (modifiers = {})).prop = true
        name = `.` + name.slice(1).replace(modifierRE, '')
      } else if (modifiers) {
        // 属性中的修饰符去掉，得到一个干净的属性名
        name = name.replace(modifierRE, '')
      }
      if (bindRE.test(name)) { // v-bind, <div :id="test"></div>
        // 处理 v-bind 指令属性，最后得到 el.attrs 或者 el.dynamicAttrs = [{ name, value, start, end, dynamic }, ...]

        // 属性名，比如：id
        name = name.replace(bindRE, '')
        // 属性值，比如：test
        value = parseFilters(value)
        // 是否为动态属性 <div :[id]="test"></div>
        isDynamic = dynamicArgRE.test(name)
        if (isDynamic) {
          // 如果是动态属性，则去掉属性两侧的方括号 []
          name = name.slice(1, -1)
        }
        // 提示，动态属性值不能为空字符串
        if (
          process.env.NODE_ENV !== 'production' &&
          value.trim().length === 0
        ) {
          warn(
            `The value for a v-bind expression cannot be empty. Found in "v-bind:${name}"`
          )
        }
        // 存在修饰符
        if (modifiers) {
          if (modifiers.prop && !isDynamic) {
            name = camelize(name)
            if (name === 'innerHtml') name = 'innerHTML'
          }
          if (modifiers.camel && !isDynamic) {
            name = camelize(name)
          }
          // 处理 sync 修饰符
          if (modifiers.sync) {
            syncGen = genAssignmentCode(value, `$event`)
            if (!isDynamic) {
              addHandler(
                el,
                `update:${camelize(name)}`,
                syncGen,
                null,
                false,
                warn,
                list[i]
              )
              if (hyphenate(name) !== camelize(name)) {
                addHandler(
                  el,
                  `update:${hyphenate(name)}`,
                  syncGen,
                  null,
                  false,
                  warn,
                  list[i]
                )
              }
            } else {
              // handler w/ dynamic event name
              addHandler(
                el,
                `"update:"+(${name})`,
                syncGen,
                null,
                false,
                warn,
                list[i],
                true // dynamic
              )
            }
          }
        }
        if ((modifiers && modifiers.prop) || (
          !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
        )) {
          // 将属性对象添加到 el.props 数组中，表示这些属性必须通过 props 设置
          // el.props = [{ name, value, start, end, dynamic }, ...]
          addProp(el, name, value, list[i], isDynamic)
        } else {
          // 将属性添加到 el.attrs 数组或者 el.dynamicAttrs 数组
          addAttr(el, name, value, list[i], isDynamic)
        }
      } else if (onRE.test(name)) { // v-on, 处理事件，<div @click="test"></div>
        // 属性名，即事件名
        name = name.replace(onRE, '')
        // 是否为动态属性
        isDynamic = dynamicArgRE.test(name)
        if (isDynamic) {
          // 动态属性，则获取 [] 中的属性名
          name = name.slice(1, -1)
        }
        // 处理事件属性，将属性的信息添加到 el.events 或者 el.nativeEvents 对象上，格式：
        // el.events = [{ value, start, end, modifiers, dynamic }, ...]
        addHandler(el, name, value, modifiers, false, warn, list[i], isDynamic)
      } else { // normal directives，其它的普通指令
        // 得到 el.directives = [{name, rawName, value, arg, isDynamicArg, modifier, start, end }, ...]
        name = name.replace(dirRE, '')
        // parse arg
        const argMatch = name.match(argRE)
        let arg = argMatch && argMatch[1]
        isDynamic = false
        if (arg) {
          name = name.slice(0, -(arg.length + 1))
          if (dynamicArgRE.test(arg)) {
            arg = arg.slice(1, -1)
            isDynamic = true
          }
        }
        addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i])
        if (process.env.NODE_ENV !== 'production' && name === 'model') {
          checkForAliasModel(el, value)
        }
      }
    } else {
      // 当前属性不是指令
      // literal attribute
      if (process.env.NODE_ENV !== 'production') {
        const res = parseText(value, delimiters)
        if (res) {
          warn(
            `${name}="${value}": ` +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div id="{{ val }}">, use <div :id="val">.',
            list[i]
          )
        }
      }
      // 将属性对象放到 el.attrs 数组中，el.attrs = [{ name, value, start, end }]
      addAttr(el, name, JSON.stringify(value), list[i])
      // #6887 firefox doesn't update muted state if set via attribute
      // even immediately after element creation
      if (!el.component &&
        name === 'muted' &&
        platformMustUseProp(el.tag, el.attrsMap.type, name)) {
        addProp(el, name, 'true', list[i])
      }
    }
  }
}

/**
 * 检查 el 元素是否被包裹在还有 v-for 属性的标签内 
 */
function checkInFor(el: ASTElement): boolean {
  let parent = el
  // 通过 e.parent 属性一级一级的向上查找，是否存在 for 属性，存在 返回 true，不存在 返回 false
  while (parent) {
    if (parent.for !== undefined) {
      return true
    }
    parent = parent.parent
  }
  return false
}

function parseModifiers(name: string): Object | void {
  const match = name.match(modifierRE)
  if (match) {
    const ret = {}
    match.forEach(m => { ret[m.slice(1)] = true })
    return ret
  }
}

/**
 * 解析属性数组，得到 { attrName: attrVal, ... } 形式的属性对象
 * @param {*} attrs = [{ name: attrName, value: attrVal, start, end }, ...]
 * @returns 
 */
function makeAttrsMap(attrs: Array<Object>): Object {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    // 属性重复设置
    if (
      process.env.NODE_ENV !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn('duplicate attribute: ' + attrs[i].name, attrs[i])
    }
    // map[attrName] = attrVal
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

// for script (e.g. type="x/template") or style, do not decode content
function isTextTag(el): boolean {
  return el.tag === 'script' || el.tag === 'style'
}

function isForbiddenTag(el): boolean {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap.type ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

const ieNSBug = /^xmlns:NS\d+/
const ieNSPrefix = /^NS\d+:/

/* istanbul ignore next */
function guardIESVGBug(attrs) {
  const res = []
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i]
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '')
      res.push(attr)
    }
  }
  return res
}

function checkForAliasModel(el, value) {
  let _el = el
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn(
        `<${el.tag} v-model="${value}">: ` +
        `You are binding v-model directly to a v-for iteration alias. ` +
        `This will not be able to modify the v-for source array because ` +
        `writing to the alias is like modifying a function local variable. ` +
        `Consider using an array of objects and use v-model on an object property instead.`,
        el.rawAttrsMap['v-model']
      )
    }
    _el = _el.parent
  }
}
