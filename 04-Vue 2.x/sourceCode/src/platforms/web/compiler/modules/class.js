/* @flow */

import { parseText } from 'compiler/parser/text-parser'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from 'compiler/helpers'

/**
 * 处理元素上的 class 属性
 * 静态的 class 属性值赋值给 el.staticClass 属性
 * 动态的 class 属性值赋值给 el.classBinding 属性
 */
function transformNode (el: ASTElement, options: CompilerOptions) {
  // 日志
  const warn = options.warn || baseWarn
  // 获取元素上静态 class 属性的值 xx，<div class="xx"></div>
  const staticClass = getAndRemoveAttr(el, 'class')
  if (process.env.NODE_ENV !== 'production' && staticClass) {
    const res = parseText(staticClass, options.delimiters)
    // 提示，同 style 的提示一样，不能使用 <div class="{{ val}}"></div>，请用
    // <div :class="val"></div> 代替
    if (res) {
      warn(
        `class="${staticClass}": ` +
        'Interpolation inside attributes has been removed. ' +
        'Use v-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.',
        el.rawAttrsMap['class']
      )
    }
  }
  // 静态 class 属性值赋值给 el.staticClass
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass)
  }
  // 获取动态绑定的 class 属性值，并赋值给 el.classBinding
  const classBinding = getBindingAttr(el, 'class', false /* getStatic */)
  if (classBinding) {
    el.classBinding = classBinding
  }
}

function genData (el: ASTElement): string {
  let data = ''
  if (el.staticClass) {
    data += `staticClass:${el.staticClass},`
  }
  if (el.classBinding) {
    data += `class:${el.classBinding},`
  }
  return data
}

export default {
  staticKeys: ['staticClass'],
  transformNode,
  genData
}
