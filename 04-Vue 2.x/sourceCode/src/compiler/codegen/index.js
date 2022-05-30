/* @flow */

import { genHandlers } from './events'
import baseDirectives from '../directives/index'
import { camelize, no, extend } from 'shared/util'
import { baseWarn, pluckModuleFunction } from '../helpers'
import { emptySlotScopeToken } from '../parser/index'

type TransformFunction = (el: ASTElement, code: string) => string;
type DataGenFunction = (el: ASTElement) => string;
type DirectiveFunction = (el: ASTElement, dir: ASTDirective, warn: Function) => boolean;

export class CodegenState {
  options: CompilerOptions;
  warn: Function;
  transforms: Array<TransformFunction>;
  dataGenFns: Array<DataGenFunction>;
  directives: { [key: string]: DirectiveFunction };
  maybeComponent: (el: ASTElement) => boolean;
  onceId: number;
  staticRenderFns: Array<string>;
  pre: boolean;

  constructor(options: CompilerOptions) {
    this.options = options
    this.warn = options.warn || baseWarn
    this.transforms = pluckModuleFunction(options.modules, 'transformCode')
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
    this.directives = extend(extend({}, baseDirectives), options.directives)
    const isReservedTag = options.isReservedTag || no
    this.maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag)
    this.onceId = 0
    this.staticRenderFns = []
    this.pre = false
  }
}

export type CodegenResult = {
  render: string,
  staticRenderFns: Array<string>
};

/**
 * 从 AST 生成渲染函数
 * @returns {
 *   render: `with(this){return _c(tag, data, children)}`,
 *   staticRenderFns: state.staticRenderFns
 * } 
 */
export function generate(
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {
  // 实例化 CodegenState 对象，生成代码的时候需要用到其中的一些东西
  const state = new CodegenState(options)
  // 生成字符串格式的代码，比如：'_c(tag, data, children, normalizationType)'
  // data 为节点上的属性组成 JSON 字符串，比如 '{ key: xx, ref: xx, ... }'
  // children 为所有子节点的字符串格式的代码组成的字符串数组，格式：
  //     `['_c(tag, data, children)', ...],normalizationType`，
  //     最后的 normalization 是 _c 的第四个参数，
  //     表示节点的规范化类型，不是重点，不需要关注
  // 当然 code 并不一定就是 _c，也有可能是其它的，比如整个组件都是静态的，则结果就为 _m(0)
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}

export function genElement(el: ASTElement, state: CodegenState): string {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre
  }

  if (el.staticRoot && !el.staticProcessed) {
    /**
     * 处理静态根节点，生成节点的渲染函数
     *   1、将当前静态节点的渲染函数放到 staticRenderFns 数组中
     *   2、返回一个可执行函数 _m(idx, true or '') 
     */
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    /**
     * 处理带有 v-once 指令的节点，结果会有三种：
     *   1、当前节点存在 v-if 指令，得到一个三元表达式，condition ? render1 : render2
     *   2、当前节点是一个包含在 v-for 指令内部的静态节点，得到 `_o(_c(tag, data, children), number, key)`
     *   3、当前节点就是一个单纯的 v-once 节点，得到 `_m(idx, true of '')`
     */
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    /**
     * 处理节点上的 v-for 指令  
     * 得到 `_l(exp, function(alias, iterator1, iterator2){return _c(tag, data, children)})`
     */
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    /**
     * 处理带有 v-if 指令的节点，最终得到一个三元表达式：condition ? render1 : render2
     */
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
    /**
     * 当前节点不是 template 标签也不是插槽和带有 v-pre 指令的节点时走这里
     * 生成所有子节点的渲染函数，返回一个数组，格式如：
     * [_c(tag, data, children, normalizationType), ...] 
     */
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    /**
     * 生成插槽的渲染函数，得到
     * _t(slotName, children, attrs, bind)
     */
    return genSlot(el, state)
  } else {
    // component or element
    // 处理动态组件和普通元素（自定义组件、原生标签）
    let code
    if (el.component) {
      /**
       * 处理动态组件，生成动态组件的渲染函数
       * 得到 `_c(compName, data, children)`
       */
      code = genComponent(el.component, el, state)
    } else {
      // 自定义组件和原生标签走这里
      let data
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        // 非普通元素或者带有 v-pre 指令的组件走这里，处理节点的所有属性，返回一个 JSON 字符串，
        // 比如 '{ key: xx, ref: xx, ... }'
        data = genData(el, state)
      }

      // 处理子节点，得到所有子节点字符串格式的代码组成的数组，格式：
      // `['_c(tag, data, children)', ...],normalizationType`，
      // 最后的 normalization 表示节点的规范化类型，不是重点，不需要关注
      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      // 得到最终的字符串格式的代码，格式：
      // '_c(tag, data, children, normalizationType)'
      code = `_c('${el.tag}'${data ? `,${data}` : '' // data
        }${children ? `,${children}` : '' // children
        })`
    }
    // 如果提供了 transformCode 方法， 
    // 则最终的 code 会经过各个模块（module）的该方法处理，
    // 不过框架没提供这个方法，不过即使处理了，最终的格式也是 _c(tag, data, children)
    // module transforms
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}

/**
 * 生成静态节点的渲染函数
 *   1、将当前静态节点的渲染函数放到 staticRenderFns 数组中
 *   2、返回一个可执行函数 _m(idx, true or '') 
 */
// hoist static sub-trees out
function genStatic(el: ASTElement, state: CodegenState): string {
  // 标记当前静态节点已经被处理过了
  el.staticProcessed = true
  // Some elements (templates) need to behave differently inside of a v-pre
  // node.  All pre nodes are static roots, so we can use this as a location to
  // wrap a state change and reset it upon exiting the pre node.
  const originalPreState = state.pre
  if (el.pre) {
    state.pre = el.pre
  }
  // 将静态根节点的渲染函数 push 到 staticRenderFns 数组中，比如：
  // [`with(this){return _c(tag, data, children)}`]
  state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)
  state.pre = originalPreState
  // 返回一个可执行函数：_m(idx, true or '')
  // idx = 当前静态节点的渲染函数在 staticRenderFns 数组中下标
  return `_m(${state.staticRenderFns.length - 1
    }${el.staticInFor ? ',true' : ''
    })`
}

/**
 * 处理带有 v-once 指令的节点，结果会有三种：
 *   1、当前节点存在 v-if 指令，得到一个三元表达式，condition ? render1 : render2
 *   2、当前节点是一个包含在 v-for 指令内部的静态节点，得到 `_o(_c(tag, data, children), number, key)`
 *   3、当前节点就是一个单纯的 v-once 节点，得到 `_m(idx, true of '')`
 */
function genOnce(el: ASTElement, state: CodegenState): string {
  // 标记当前节点的 v-once 指令已经被处理过了
  el.onceProcessed = true
  if (el.if && !el.ifProcessed) {
    // 如果含有 v-if 指令 && if 指令没有被处理过，则走这里
    // 处理带有 v-if 指令的节点，最终得到一个三元表达式，condition ? render1 : render2 
    return genIf(el, state)
  } else if (el.staticInFor) {
    // 说明当前节点是被包裹在还有 v-for 指令节点内部的静态节点
    // 获取 v-for 指令的 key
    let key = ''
    let parent = el.parent
    while (parent) {
      if (parent.for) {
        key = parent.key
        break
      }
      parent = parent.parent
    }
    // key 不存在则给出提示，v-once 节点只能用于带有 key 的 v-for 节点内部
    if (!key) {
      process.env.NODE_ENV !== 'production' && state.warn(
        `v-once can only be used inside v-for that is keyed. `,
        el.rawAttrsMap['v-once']
      )
      return genElement(el, state)
    }
    // 生成 `_o(_c(tag, data, children), number, key)`
    return `_o(${genElement(el, state)},${state.onceId++},${key})`
  } else {
    // 上面几种情况都不符合，说明就是一个简单的静态节点，和处理静态根节点时的操作一样,
    // 得到 _m(idx, true or '')
    return genStatic(el, state)
  }
}

/**
 * 处理带有 v-if 指令的节点，最终得到一个三元表达式，condition ? render1 : render2 
 */
export function genIf(
  el: any,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  // 标记当前节点的 v-if 指令已经被处理过了，避免无效的递归
  el.ifProcessed = true // avoid recursion
  // 得到三元表达式，condition ? render1 : render2
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

function genIfConditions(
  conditions: ASTIfConditions,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  // 长度若为空，则直接返回一个空节点渲染函数
  if (!conditions.length) {
    return altEmpty || '_e()'
  }

  // 从 conditions 数组中拿出第一个条件对象 { exp, block }
  const condition = conditions.shift()
  // 返回结果是一个三元表达式字符串，condition ? 渲染函数1 : 渲染函数2
  if (condition.exp) {
    // 如果 condition.exp 条件成立，则得到一个三元表达式，
    // 如果条件不成立，则通过递归的方式找 conditions 数组中下一个元素，
    // 直到找到条件成立的元素，然后返回一个三元表达式
    return `(${condition.exp})?${genTernaryExp(condition.block)
      }:${genIfConditions(conditions, state, altGen, altEmpty)
      }`
  } else {
    return `${genTernaryExp(condition.block)}`
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp(el) {
    return altGen
      ? altGen(el, state)
      : el.once
        ? genOnce(el, state)
        : genElement(el, state)
  }
}

/**
 * 处理节点上的 v-for 指令  
 * 得到 `_l(exp, function(alias, iterator1, iterator2){return _c(tag, data, children)})`
 */
export function genFor(
  el: any,
  state: CodegenState,
  altGen?: Function,
  altHelper?: string
): string {
  // v-for 的迭代器，比如 一个数组
  const exp = el.for
  // 迭代时的别名
  const alias = el.alias
  // iterator 为 v-for = "(item ,idx) in obj" 时会有，比如 iterator1 = idx
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

  // 提示，v-for 指令在组件上时必须使用 key
  if (process.env.NODE_ENV !== 'production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
      `v-for should have explicit keys. ` +
      `See https://vuejs.org/guide/list.html#key for more info.`,
      el.rawAttrsMap['v-for'],
      true /* tip */
    )
  }

  // 标记当前节点上的 v-for 指令已经被处理过了
  el.forProcessed = true // avoid r
  // 得到 `_l(exp, function(alias, iterator1, iterator2){return _c(tag, data, children)})`
  return `${altHelper || '_l'}((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
    `return ${(altGen || genElement)(el, state)}` +
    '})'
}

/**
 * 处理节点上的众多属性，最后生成这些属性组成的 JSON 字符串，比如 data = { key: xx, ref: xx, ... } 
 */
export function genData(el: ASTElement, state: CodegenState): string {
  // 节点的属性组成的 JSON 字符串
  let data = '{'

  // 首先先处理指令，因为指令可能在生成其它属性之前改变这些属性
  // 执行指令编译方法，比如 web 平台的 v-text、v-html、v-model，然后在 el 对象上添加相应的属性，
  // 比如 v-text： el.textContent = _s(value, dir)
  //     v-html：el.innerHTML = _s(value, dir)
  // 当指令在运行时还有任务时，比如 v-model，则返回 directives: [{ name, rawName, value, arg, modifiers }, ...}] 
  // directives first.
  // directives may mutate the el's other properties before they are generated.
  const dirs = genDirectives(el, state)
  if (dirs) data += dirs + ','

  // key，data = { key: xx }
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref，data = { ref: xx }
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  // 带有 ref 属性的节点在带有 v-for 指令的节点的内部， data = { refInFor: true }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  // pre，v-pre 指令，data = { pre: true }
  if (el.pre) {
    data += `pre:true,`
  }
  // 动态组件，data = { tag: 'component' }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  // 为节点执行模块(class、style)的 genData 方法，
  // 得到 data = { staticClass: xx, class: xx, staticStyle: xx, style: xx }
  // module data generation functions
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el)
  }
  // 其它属性，得到 data = { attrs: 静态属性字符串 } 或者 
  // data = { attrs: '_d(静态属性字符串, 动态属性字符串)' }
  // attributes
  if (el.attrs) {
    data += `attrs:${genProps(el.attrs)},`
  }
  // DOM props，结果同 el.attrs
  if (el.props) {
    data += `domProps:${genProps(el.props)},`
  }
  // 自定义事件，data = { `on${eventName}:handleCode` } 或者 { `on_d(${eventName}:handleCode`, `${eventName},handleCode`) }
  // event handlers
  if (el.events) {
    data += `${genHandlers(el.events, false)},`
  }
  // 带 .native 修饰符的事件，
  // data = { `nativeOn${eventName}:handleCode` } 或者 { `nativeOn_d(${eventName}:handleCode`, `${eventName},handleCode`) }
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true)},`
  }
  // 非作用域插槽，得到 data = { slot: slotName }
  // slot target
  // only for non-scoped slots
  if (el.slotTarget && !el.slotScope) {
    data += `slot:${el.slotTarget},`
  }
  // scoped slots，作用域插槽，data = { scopedSlots: '_u(xxx)' }
  if (el.scopedSlots) {
    data += `${genScopedSlots(el, el.scopedSlots, state)},`
  }
  // 处理 v-model 属性，得到
  // data = { model: { value, callback, expression } }
  // component v-model
  if (el.model) {
    data += `model:{value:${el.model.value
      },callback:${el.model.callback
      },expression:${el.model.expression
      }},`
  }
  // inline-template，处理内联模版，得到
  // data = { inlineTemplate: { render: function() { render 函数 }, staticRenderFns: [ function() {}, ... ] } }
  if (el.inlineTemplate) {
    const inlineTemplate = genInlineTemplate(el, state)
    if (inlineTemplate) {
      data += `${inlineTemplate},`
    }
  }
  // 删掉 JSON 字符串最后的 逗号，然后加上闭合括号 }
  data = data.replace(/,$/, '') + '}'
  // v-bind dynamic argument wrap
  // v-bind with dynamic arguments must be applied using the same v-bind object
  // merge helper so that class/style/mustUseProp attrs are handled correctly.
  if (el.dynamicAttrs) {
    // 存在动态属性，data = `_b(data, tag, 静态属性字符串或者_d(静态属性字符串, 动态属性字符串))`
    data = `_b(${data},"${el.tag}",${genProps(el.dynamicAttrs)})`
  }
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data)
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data)
  }
  return data
}

/**
 * 运行指令的编译方法，如果指令存在运行时任务，则返回 directives: [{ name, rawName, value, arg, modifiers }, ...}] 
 */
function genDirectives(el: ASTElement, state: CodegenState): string | void {
  // 获取指令数组
  const dirs = el.directives
  // 没有指令则直接结束
  if (!dirs) return
  // 指令的处理结果
  let res = 'directives:['
  // 标记，用于标记指令是否需要在运行时完成的任务，比如 v-model 的 input 事件
  let hasRuntime = false
  let i, l, dir, needRuntime
  // 遍历指令数组
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    // 获取节点当前指令的处理方法，比如 web 平台的 v-html、v-text、v-model
    const gen: DirectiveFunction = state.directives[dir.name]
    if (gen) {
      // 执行指令的编译方法，如果指令还需要运行时完成一部分任务，则返回 true，比如 v-model
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn)
    }
    if (needRuntime) {
      // 表示该指令在运行时还有任务
      hasRuntime = true
      // res = directives:[{ name, rawName, value, arg, modifiers }, ...]
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
        }${dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''
        }${dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
        }},`
    }
  }
  if (hasRuntime) {
    // 也就是说，只有指令存在运行时任务时，才会返回 res
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate(el: ASTElement, state: CodegenState): ?string {
  const ast = el.children[0]
  if (process.env.NODE_ENV !== 'production' && (
    el.children.length !== 1 || ast.type !== 1
  )) {
    state.warn(
      'Inline-template components must have exactly one child element.',
      { start: el.start }
    )
  }
  if (ast && ast.type === 1) {
    const inlineRenderFns = generate(ast, state.options)
    return `inlineTemplate:{render:function(){${inlineRenderFns.render
      }},staticRenderFns:[${inlineRenderFns.staticRenderFns.map(code => `function(){${code}}`).join(',')
      }]}`
  }
}

function genScopedSlots(
  el: ASTElement,
  slots: { [key: string]: ASTElement },
  state: CodegenState
): string {
  // by default scoped slots are considered "stable", this allows child
  // components with only scoped slots to skip forced updates from parent.
  // but in some cases we have to bail-out of this optimization
  // for example if the slot contains dynamic names, has v-if or v-for on them...
  let needsForceUpdate = el.for || Object.keys(slots).some(key => {
    const slot = slots[key]
    return (
      slot.slotTargetDynamic ||
      slot.if ||
      slot.for ||
      containsSlotChild(slot) // is passing down slot from parent which may be dynamic
    )
  })

  // #9534: if a component with scoped slots is inside a conditional branch,
  // it's possible for the same component to be reused but with different
  // compiled slot content. To avoid that, we generate a unique key based on
  // the generated code of all the slot contents.
  let needsKey = !!el.if

  // OR when it is inside another scoped slot or v-for (the reactivity may be
  // disconnected due to the intermediate scope variable)
  // #9438, #9506
  // TODO: this can be further optimized by properly analyzing in-scope bindings
  // and skip force updating ones that do not actually use scope variables.
  if (!needsForceUpdate) {
    let parent = el.parent
    while (parent) {
      if (
        (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
        parent.for
      ) {
        needsForceUpdate = true
        break
      }
      if (parent.if) {
        needsKey = true
      }
      parent = parent.parent
    }
  }

  const generatedSlots = Object.keys(slots)
    .map(key => genScopedSlot(slots[key], state))
    .join(',')

  return `scopedSlots:_u([${generatedSlots}]${needsForceUpdate ? `,null,true` : ``
    }${!needsForceUpdate && needsKey ? `,null,false,${hash(generatedSlots)}` : ``
    })`
}

function hash(str) {
  let hash = 5381
  let i = str.length
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0
}

function containsSlotChild(el: ASTNode): boolean {
  if (el.type === 1) {
    if (el.tag === 'slot') {
      return true
    }
    return el.children.some(containsSlotChild)
  }
  return false
}

function genScopedSlot(
  el: ASTElement,
  state: CodegenState
): string {
  const isLegacySyntax = el.attrsMap['slot-scope']
  if (el.if && !el.ifProcessed && !isLegacySyntax) {
    return genIf(el, state, genScopedSlot, `null`)
  }
  if (el.for && !el.forProcessed) {
    return genFor(el, state, genScopedSlot)
  }
  const slotScope = el.slotScope === emptySlotScopeToken
    ? ``
    : String(el.slotScope)
  const fn = `function(${slotScope}){` +
    `return ${el.tag === 'template'
      ? el.if && isLegacySyntax
        ? `(${el.if})?${genChildren(el, state) || 'undefined'}:undefined`
        : genChildren(el, state) || 'undefined'
      : genElement(el, state)
    }}`
  // reverse proxy v-slot without scope on this.$slots
  const reverseProxy = slotScope ? `` : `,proxy:true`
  return `{key:${el.slotTarget || `"default"`},fn:${fn}${reverseProxy}}`
}

/**
 * 生成所有子节点的渲染函数，返回一个数组，格式如：
 * [_c(tag, data, children, normalizationType), ...] 
 */
export function genChildren(
  el: ASTElement,
  state: CodegenState,
  checkSkip?: boolean,
  altGenElement?: Function,
  altGenNode?: Function
): string | void {
  // 所有子节点
  const children = el.children
  if (children.length) {
    // 第一个子节点
    const el: any = children[0]
    // optimize single v-for
    if (children.length === 1 &&
      el.for &&
      el.tag !== 'template' &&
      el.tag !== 'slot'
    ) {
      // 优化，只有一个子节点 && 子节点的上有 v-for 指令 && 子节点的标签不为 template 或者 slot
      // 优化的方式是直接调用 genElement 生成该节点的渲染函数，不需要走下面的循环然后调用 genCode 最后得到渲染函数
      const normalizationType = checkSkip
        ? state.maybeComponent(el) ? `,1` : `,0`
        : ``
      return `${(altGenElement || genElement)(el, state)}${normalizationType}`
    }
    // 获取节点规范化类型，返回一个 number 0、1、2，不是重点， 不重要
    const normalizationType = checkSkip
      ? getNormalizationType(children, state.maybeComponent)
      : 0
    // 函数，生成代码的一个函数
    const gen = altGenNode || genNode
    // 返回一个数组，数组的每个元素都是一个子节点的渲染函数，
    // 格式：['_c(tag, data, children, normalizationType)', ...]
    return `[${children.map(c => gen(c, state)).join(',')}]${normalizationType ? `,${normalizationType}` : ''
      }`
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType(
  children: Array<ASTNode>,
  maybeComponent: (el: ASTElement) => boolean
): number {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el: ASTNode = children[i]
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
      (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }
    if (maybeComponent(el) ||
      (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1
    }
  }
  return res
}

function needsNormalization(el: ASTElement): boolean {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode(node: ASTNode, state: CodegenState): string {
  if (node.type === 1) {
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

export function genText(text: ASTText | ASTExpression): string {
  return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))
    })`
}

export function genComment(comment: ASTText): string {
  return `_e(${JSON.stringify(comment.text)})`
}

/**
 * 生成插槽的渲染函数，得到
 * _t(slotName, children, attrs, bind)
 */
function genSlot(el: ASTElement, state: CodegenState): string {
  // 插槽名称
  const slotName = el.slotName || '"default"'
  // 生成所有的子节点
  const children = genChildren(el, state)
  // 结果字符串，_t(slotName, children, attrs, bind)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs || el.dynamicAttrs
    ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(attr => ({
      // slot props are camelized
      name: camelize(attr.name),
      value: attr.value,
      dynamic: attr.dynamic
    })))
    : null
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
/**
 * 生成动态组件的渲染函数
 * 返回 `_c(compName, data, children)`
 */
function genComponent(
  componentName: string,
  el: ASTElement,
  state: CodegenState
): string {
  // 所有的子节点
  const children = el.inlineTemplate ? null : genChildren(el, state, true)
  // 返回 `_c(compName, data, children)`
  // compName 是 is 属性的值
  return `_c(${componentName},${genData(el, state)}${children ? `,${children}` : ''
    })`
}

/**
 * 遍历属性数组 props，得到所有属性组成的字符串
 * 如果不存在动态属性，则返回：
 *   'attrName,attrVal,...'
 * 如果存在动态属性，则返回：
 *   '_d(静态属性字符串, 动态属性字符串)' 
 */
function genProps(props: Array<ASTAttr>): string {
  // 静态属性
  let staticProps = ``
  // 动态属性
  let dynamicProps = ``
  // 遍历属性数组
  for (let i = 0; i < props.length; i++) {
    // 属性
    const prop = props[i]
    // 属性值
    const value = __WEEX__
      ? generateValue(prop.value)
      : transformSpecialNewlines(prop.value)
    if (prop.dynamic) {
      // 动态属性，`dAttrName,dAttrVal,...`
      dynamicProps += `${prop.name},${value},`
    } else {
      // 静态属性，'attrName,attrVal,...'
      staticProps += `"${prop.name}":${value},`
    }
  }
  // 去掉静态属性最后的逗号
  staticProps = `{${staticProps.slice(0, -1)}}`
  if (dynamicProps) {
    // 如果存在动态属性则返回：
    // _d(静态属性字符串，动态属性字符串)
    return `_d(${staticProps},[${dynamicProps.slice(0, -1)}])`
  } else {
    // 说明属性数组中不存在动态属性，直接返回静态属性字符串
    return staticProps
  }
}

/* istanbul ignore next */
function generateValue(value) {
  if (typeof value === 'string') {
    return transformSpecialNewlines(value)
  }
  return JSON.stringify(value)
}

// #3895, #4268
function transformSpecialNewlines(text: string): string {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
