/* @flow */

/**
 * Expand input[v-model] with dynamic type bindings into v-if-else chains
 * Turn this:
 *   <input v-model="data[type]" :type="type">
 * into this:
 *   <input v-if="type === 'checkbox'" type="checkbox" v-model="data[type]">
 *   <input v-else-if="type === 'radio'" type="radio" v-model="data[type]">
 *   <input v-else :type="type" v-model="data[type]">
 */

import {
  addRawAttr,
  getBindingAttr,
  getAndRemoveAttr
} from 'compiler/helpers'

import {
  processFor,
  processElement,
  addIfCondition,
  createASTElement
} from 'compiler/parser/index'

/**
 * 处理存在 v-model 的 input 标签，但没处理 v-model 属性
 * 分别处理了 input 为 checkbox、radio 和 其它的情况
 * input 具体是哪种情况由 el.ifConditions 中的条件来判断
 * <input v-mode="test" :type="checkbox or radio or other(比如 text)" />
 * @param {*} el 
 * @param {*} options 
 * @returns branch0
 */
function preTransformNode (el: ASTElement, options: CompilerOptions) {
  if (el.tag === 'input') {
    const map = el.attrsMap
    // 不存在 v-model 属性，直接结束
    if (!map['v-model']) {
      return
    }

    // 获取 :type 的值
    let typeBinding
    if (map[':type'] || map['v-bind:type']) {
      typeBinding = getBindingAttr(el, 'type')
    }
    if (!map.type && !typeBinding && map['v-bind']) {
      typeBinding = `(${map['v-bind']}).type`
    }

    // 如果存在 type 属性
    if (typeBinding) {
      // 获取 v-if 的值，比如： <input v-model="test" :type="checkbox" v-if="test" />
      const ifCondition = getAndRemoveAttr(el, 'v-if', true)
      // &&test
      const ifConditionExtra = ifCondition ? `&&(${ifCondition})` : ``
      // 是否存在 v-else 属性，<input v-else />
      const hasElse = getAndRemoveAttr(el, 'v-else', true) != null
      // 获取 v-else-if 属性的值 <inpu v-else-if="test" />
      const elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true)
      // 克隆一个新的 el 对象，分别处理 input 为 chekbox、radio 或 其它的情况
      // 具体是哪种情况，通过 el.ifConditins 条件来判断
      // 1. checkbox
      const branch0 = cloneASTElement(el)
      // process for on the main node
      // <input v-for="item in arr" :key="item" />
      // 处理 v-for 表达式，得到 branch0.for = arr, branch0.alias = item
      processFor(branch0)
      // 在 branch0.attrsMap 和 branch0.attrsList 对象中添加 type 属性
      addRawAttr(branch0, 'type', 'checkbox')
      // 分别处理元素节点的 key、ref、插槽、自闭合的 slot 标签、动态组件、class、style、v-bind、v-on、其它指令和一些原生属性 
      processElement(branch0, options)
      // 标记当前对象已经被处理过了
      branch0.processed = true // prevent it from double-processed
      // 得到 true&&test or false&&test，标记当前 input 是否为 checkbox
      branch0.if = `(${typeBinding})==='checkbox'` + ifConditionExtra
      // 在 branch0.ifConfitions 数组中放入 { exp, block } 对象
      addIfCondition(branch0, {
        exp: branch0.if,
        block: branch0
      })
      // 克隆一个新的 ast 对象
      // 2. add radio else-if condition
      const branch1 = cloneASTElement(el)
      // 获取 v-for 属性值
      getAndRemoveAttr(branch1, 'v-for', true)
      // 在 branch1.attrsMap 和 branch1.attrsList 对象中添加 type 属性
      addRawAttr(branch1, 'type', 'radio')
      // 分别处理元素节点的 key、ref、插槽、自闭合的 slot 标签、动态组件、class、style、v-bind、v-on、其它指令和一些原生属性 
      processElement(branch1, options)
      // 在 branch0.ifConfitions 数组中放入 { exp, block } 对象
      addIfCondition(branch0, {
        // 标记当前 input 是否为 radio
        exp: `(${typeBinding})==='radio'` + ifConditionExtra,
        block: branch1
      })
      // 3. other，input 为其它的情况
      const branch2 = cloneASTElement(el)
      getAndRemoveAttr(branch2, 'v-for', true)
      addRawAttr(branch2, ':type', typeBinding)
      processElement(branch2, options)
      addIfCondition(branch0, {
        exp: ifCondition,
        block: branch2
      })

      // 给 branch0 设置 else 或 elseif 条件
      if (hasElse) {
        branch0.else = true
      } else if (elseIfCondition) {
        branch0.elseif = elseIfCondition
      }

      return branch0
    }
  }
}

function cloneASTElement (el) {
  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

export default {
  preTransformNode
}
