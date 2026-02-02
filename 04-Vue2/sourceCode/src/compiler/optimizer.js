/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

let isStaticKey
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * 优化：
 *   遍历 AST，标记每个节点是静态节点还是动态节点，然后标记静态根节点
 *   这样在后续更新的过程中就不需要再关注这些节点
 */
export function optimize(root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  /**
   * options.staticKeys = 'staticClass,staticStyle'
   * isStaticKey = function(val) { return map[val] }
   */
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  // 平台保留标签
  isPlatformReservedTag = options.isReservedTag || no
  // 遍历所有节点，给每个节点设置 static 属性，标识其是否为静态节点
  markStatic(root)
  // 进一步标记静态根，一个节点要成为静态根节点，需要具体以下条件：
  // 节点本身是静态节点，而且有子节点，而且子节点不只是一个文本节点，则标记为静态根
  // 静态根节点不能只有静态文本的子节点，因为这样收益太低，这种情况下始终更新它就好了
  markStaticRoots(root, false)
}

function genStaticKeys(keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

/**
 * 在所有节点上设置 static 属性，用来标识是否为静态节点
 * 注意：如果有子节点为动态节点，则父节点也被认为是动态节点
 * @param {*} node 
 * @returns 
 */
function markStatic(node: ASTNode) {
  // 通过 node.static 来标识节点是否为 静态节点
  node.static = isStatic(node)
  if (node.type === 1) {
    /**
     * 不要将组件的插槽内容设置为静态节点，这样可以避免：
     *   1、组件不能改变插槽节点
     *   2、静态插槽内容在热重载时失败
     */
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      // 递归终止条件，如果节点不是平台保留标签  && 也不是 slot 标签 && 也不是内联模版，则直接结束
      return
    }
    // 遍历子节点，递归调用 markStatic 来标记这些子节点的 static 属性
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      // 如果子节点是非静态节点，则将父节点更新为非静态节点
      if (!child.static) {
        node.static = false
      }
    }
    // 如果节点存在 v-if、v-else-if、v-else 这些指令，则依次标记 block 中节点的 static 属性
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

/**
 * 进一步标记静态根，一个节点要成为静态根节点，需要具体以下条件：
 * 节点本身是静态节点，而且有子节点，而且子节点不只是一个文本节点，则标记为静态根
 * 静态根节点不能只有静态文本的子节点，因为这样收益太低，这种情况下始终更新它就好了
 * 
 * @param { ASTElement } node 当前节点
 * @param { boolean } isInFor 当前节点是否被包裹在 v-for 指令所在的节点内
 */
function markStaticRoots(node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      // 节点是静态的 或者 节点上有 v-once 指令，标记 node.staticInFor = true or false
      node.staticInFor = isInFor
    }

    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      // 节点本身是静态节点，而且有子节点，而且子节点不只是一个文本节点，则标记为静态根 => node.staticRoot = true，否则为非静态根
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    // 当前节点不是静态根节点的时候，递归遍历其子节点，标记静态根
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    // 如果节点存在 v-if、v-else-if、v-else 指令，则为 block 节点标记静态根
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

/**
 * 判断节点是否为静态节点：
 *  通过自定义的 node.type 来判断，2: 表达式 => 动态，3: 文本 => 静态
 *  凡是有 v-bind、v-if、v-for 等指令的都属于动态节点
 *  组件为动态节点
 *  父节点为含有 v-for 指令的 template 标签，则为动态节点
 * @param {*} node 
 * @returns boolean
 */
function isStatic(node: ASTNode): boolean {
  if (node.type === 2) { // expression
    // 比如：{{ msg }}
    return false
  }
  if (node.type === 3) { // text
    return true
  }
  return !!(node.pre || (
    !node.hasBindings && // no dynamic bindings
    !node.if && !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in
    isPlatformReservedTag(node.tag) && // not a component
    !isDirectChildOfTemplateFor(node) &&
    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor(node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}
