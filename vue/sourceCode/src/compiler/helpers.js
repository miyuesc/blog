/* @flow */

import { emptyObject } from 'shared/util'
import { parseFilters } from './parser/filter-parser'

type Range = { start?: number, end?: number };

/* eslint-disable no-unused-vars */
export function baseWarn (msg: string, range?: Range) {
  console.error(`[Vue compiler]: ${msg}`)
}
/* eslint-enable no-unused-vars */

export function pluckModuleFunction<F: Function> (
  modules: ?Array<Object>,
  key: string
): Array<F> {
  return modules
    ? modules.map(m => m[key]).filter(_ => _)
    : []
}

export function addProp (el: ASTElement, name: string, value: string, range?: Range, dynamic?: boolean) {
  (el.props || (el.props = [])).push(rangeSetItem({ name, value, dynamic }, range))
  el.plain = false
}

export function addAttr (el: ASTElement, name: string, value: any, range?: Range, dynamic?: boolean) {
  const attrs = dynamic
    ? (el.dynamicAttrs || (el.dynamicAttrs = []))
    : (el.attrs || (el.attrs = []))
  attrs.push(rangeSetItem({ name, value, dynamic }, range))
  el.plain = false
}

// 在 el.attrsMap 和 el.attrsList 中添加指定属性 name
// add a raw attr (use this in preTransforms)
export function addRawAttr (el: ASTElement, name: string, value: any, range?: Range) {
  el.attrsMap[name] = value
  el.attrsList.push(rangeSetItem({ name, value }, range))
}

export function addDirective (
  el: ASTElement,
  name: string,
  rawName: string,
  value: string,
  arg: ?string,
  isDynamicArg: boolean,
  modifiers: ?ASTModifiers,
  range?: Range
) {
  (el.directives || (el.directives = [])).push(rangeSetItem({
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers
  }, range))
  el.plain = false
}

function prependModifierMarker (symbol: string, name: string, dynamic?: boolean): string {
  return dynamic
    ? `_p(${name},"${symbol}")`
    : symbol + name // mark the event as captured
}

/**
 * 处理事件属性，将事件属性添加到 el.events 对象或者 el.nativeEvents 对象中，格式：
 * el.events[name] = [{ value, start, end, modifiers, dynamic }, ...]
 * 其中用了大量的篇幅在处理 name 属性带修饰符 (modifier) 的情况
 * @param {*} el ast 对象
 * @param {*} name 属性名，即事件名
 * @param {*} value 属性值，即事件回调函数名
 * @param {*} modifiers 修饰符
 * @param {*} important 
 * @param {*} warn 日志
 * @param {*} range 
 * @param {*} dynamic 属性名是否为动态属性
 */
export function addHandler (
  el: ASTElement,
  name: string,
  value: string,
  modifiers: ?ASTModifiers,
  important?: boolean,
  warn?: ?Function,
  range?: Range,
  dynamic?: boolean
) {
  // modifiers 是一个对象，如果传递的参数为空，则给一个冻结的空对象
  modifiers = modifiers || emptyObject
  // 提示：prevent 和 passive 修饰符不能一起使用
  // warn prevent and passive modifier
  /* istanbul ignore if */
  if (
    process.env.NODE_ENV !== 'production' && warn &&
    modifiers.prevent && modifiers.passive
  ) {
    warn(
      'passive and prevent can\'t be used together. ' +
      'Passive handler can\'t prevent default event.',
      range
    )
  }

  // 标准化 click.right 和 click.middle，它们实际上不会被真正的触发，从技术讲他们是它们
  // 是特定于浏览器的，但至少目前位置只有浏览器才具有右键和中间键的点击
  // normalize click.right and click.middle since they don't actually fire
  // this is technically browser-specific, but at least for now browsers are
  // the only target envs that have right/middle clicks.
  if (modifiers.right) {
    // 右键
    if (dynamic) {
      // 动态属性
      name = `(${name})==='click'?'contextmenu':(${name})`
    } else if (name === 'click') {
      // 非动态属性，name = contextmenu
      name = 'contextmenu'
      // 删除修饰符中的 right 属性
      delete modifiers.right
    }
  } else if (modifiers.middle) {
    // 中间键
    if (dynamic) {
      // 动态属性，name => mouseup 或者 ${name}
      name = `(${name})==='click'?'mouseup':(${name})`
    } else if (name === 'click') {
      // 非动态属性，mouseup
      name = 'mouseup'
    }
  }

  /**
   * 处理 capture、once、passive 这三个修饰符，通过给 name 添加不同的标记来标记这些修饰符
   */
  // check capture modifier
  if (modifiers.capture) {
    delete modifiers.capture
    // 给带有 capture 修饰符的属性，加上 ! 标记
    name = prependModifierMarker('!', name, dynamic)
  }
  if (modifiers.once) {
    delete modifiers.once
    // once 修饰符加 ~ 标记
    name = prependModifierMarker('~', name, dynamic)
  }
  /* istanbul ignore if */
  if (modifiers.passive) {
    delete modifiers.passive
    // passive 修饰符加 & 标记
    name = prependModifierMarker('&', name, dynamic)
  }

  let events
  if (modifiers.native) {
    // native 修饰符， 监听组件根元素的原生事件，将事件信息存放到 el.nativeEvents 对象中
    delete modifiers.native
    events = el.nativeEvents || (el.nativeEvents = {})
  } else {
    events = el.events || (el.events = {})
  }

  const newHandler: any = rangeSetItem({ value: value.trim(), dynamic }, range)
  if (modifiers !== emptyObject) {
    // 说明有修饰符，将修饰符对象放到 newHandler 对象上
    // { value, dynamic, start, end, modifiers }
    newHandler.modifiers = modifiers
  }

  // 将配置对象放到 events[name] = [newHander, handler, ...]
  const handlers = events[name]
  /* istanbul ignore if */
  if (Array.isArray(handlers)) {
    important ? handlers.unshift(newHandler) : handlers.push(newHandler)
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
  } else {
    events[name] = newHandler
  }

  el.plain = false
}

export function getRawBindingAttr (
  el: ASTElement,
  name: string
) {
  return el.rawAttrsMap[':' + name] ||
    el.rawAttrsMap['v-bind:' + name] ||
    el.rawAttrsMap[name]
}

/**
 * 获取 el 对象上执行属性 name 的值 
 */
export function getBindingAttr (
  el: ASTElement,
  name: string,
  getStatic?: boolean
): ?string {
  // 获取指定属性的值
  const dynamicValue =
    getAndRemoveAttr(el, ':' + name) ||
    getAndRemoveAttr(el, 'v-bind:' + name)
  if (dynamicValue != null) {
    return parseFilters(dynamicValue)
  } else if (getStatic !== false) {
    const staticValue = getAndRemoveAttr(el, name)
    if (staticValue != null) {
      return JSON.stringify(staticValue)
    }
  }
}

/**
 * 从 el.attrsList 中删除指定的属性 name
 * 如果 removeFromMap 为 true，则同样删除 el.attrsMap 对象中的该属性，
 *   比如 v-if、v-else-if、v-else 等属性就会被移除,
 *   不过一般不会删除该对象上的属性，因为从 ast 生成 代码 期间还需要使用该对象
 * 返回指定属性的值
 */
// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
export function getAndRemoveAttr (
  el: ASTElement,
  name: string,
  removeFromMap?: boolean
): ?string {
  let val
  // 将执行属性 name 从 el.attrsList 中移除
  if ((val = el.attrsMap[name]) != null) {
    const list = el.attrsList
    for (let i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1)
        break
      }
    }
  }
  // 如果 removeFromMap 为 true，则从 el.attrsMap 中移除指定的属性 name
  // 不过一般不会移除 el.attsMap 中的数据，因为从 ast 生成 代码 期间还需要使用该对象
  if (removeFromMap) {
    delete el.attrsMap[name]
  }
  // 返回执行属性的值
  return val
}

export function getAndRemoveAttrByRegex (
  el: ASTElement,
  name: RegExp
) {
  const list = el.attrsList
  for (let i = 0, l = list.length; i < l; i++) {
    const attr = list[i]
    if (name.test(attr.name)) {
      list.splice(i, 1)
      return attr
    }
  }
}

function rangeSetItem (
  item: any,
  range?: { start?: number, end?: number }
) {
  if (range) {
    if (range.start != null) {
      item.start = range.start
    }
    if (range.end != null) {
      item.end = range.end
    }
  }
  return item
}
