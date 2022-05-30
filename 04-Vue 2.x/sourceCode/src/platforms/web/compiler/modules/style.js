/* @flow */

import { parseText } from 'compiler/parser/text-parser'
import { parseStyleText } from 'web/util/style'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from 'compiler/helpers'

/**
 * 从 el 上解析出静态的 style 属性和动态绑定的 style 属性，分别赋值给：
 * el.staticStyle 和 el.styleBinding
 * @param {*} el 
 * @param {*} options 
 */
function transformNode(el: ASTElement, options: CompilerOptions) {
  // 日志
  const warn = options.warn || baseWarn
  // <div style="xx"></div>
  // 获取 style 属性
  const staticStyle = getAndRemoveAttr(el, 'style')
  if (staticStyle) {
    // 提示，如果从 xx 中解析到了界定符，说明是一个动态的 style，
    // 比如 <div style="{{ val }}"></div>则给出提示:
    // 动态的 style 请使用 <div :style="val"></div>
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      const res = parseText(staticStyle, options.delimiters)
      if (res) {
        warn(
          `style="${staticStyle}": ` +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div style="{{ val }}">, use <div :style="val">.',
          el.rawAttrsMap['style']
        )
      }
    }
    // 将静态的 style 样式赋值给 el.staticStyle
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle))
  }

  // 获取动态绑定的 style 属性，比如 <div :style="{{ val }}"></div>
  const styleBinding = getBindingAttr(el, 'style', false /* getStatic */)
  if (styleBinding) {
    // 赋值给 el.styleBinding
    el.styleBinding = styleBinding
  }
}

function genData(el: ASTElement): string {
  let data = ''
  if (el.staticStyle) {
    data += `staticStyle:${el.staticStyle},`
  }
  if (el.styleBinding) {
    data += `style:(${el.styleBinding}),`
  }
  return data
}

export default {
  staticKeys: ['staticStyle'],
  transformNode,
  genData
}
