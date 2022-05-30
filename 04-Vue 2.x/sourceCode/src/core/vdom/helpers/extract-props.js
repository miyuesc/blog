/* @flow */

import {
  tip,
  hasOwn,
  isDef,
  isUndef,
  hyphenate,
  formatComponentName
} from 'core/util/index'

/**
 * <comp :msg="hello vue"></comp>
 * 
 * 提取 props，得到 res[key] = val 
 * 
 * 以 props 配置中的属性为 key，父组件中对应的的数据为 value
 * 当父组件中数据更新时，触发响应式更新，重新执行 render，生成新的 vnode，又走到这里
 * 这样子组件中相应的数据就会被更新 
 */
export function extractPropsFromVNodeData (
  data: VNodeData, // { msg: 'hello vue' }
  Ctor: Class<Component>, // 组件构造函数
  tag?: string // 组件标签名
): ?Object {
  // 组件的 props 选项，{ props: { msg: { type: String, default: xx } } }
  
  // 这里只提取原始值，验证和默认值在子组件中处理
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  const propOptions = Ctor.options.props
  if (isUndef(propOptions)) {
    // 未定义 props 直接返回
    return
  }
  // 以组件 props 配置中的属性为 key，父组件传递下来的值为 value
  // 当父组件中数据更新时，触发响应式更新，重新执行 render，生成新的 vnode，又走到这里
  // 这样子组件中相应的数据就会被更新
  const res = {}
  const { attrs, props } = data
  if (isDef(attrs) || isDef(props)) {
    // 遍历 propsOptions
    for (const key in propOptions) {
      // 将小驼峰形式的 key 转换为 连字符 形式
      const altKey = hyphenate(key)
      // 提示，如果声明的 props 为小驼峰形式（testProps），但由于 html 不区分大小写，所以在 html 模版中应该使用 test-props 代替 testProps
      if (process.env.NODE_ENV !== 'production') {
        const keyInLowerCase = key.toLowerCase()
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            `Prop "${keyInLowerCase}" is passed to component ` +
            `${formatComponentName(tag || Ctor)}, but the declared prop name is` +
            ` "${key}". ` +
            `Note that HTML attributes are case-insensitive and camelCased ` +
            `props need to use their kebab-case equivalents when using in-DOM ` +
            `templates. You should probably use "${altKey}" instead of "${key}".`
          )
        }
      }
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false)
    }
  }
  return res
}

/**
 * 得到 res[key] = val
 */
function checkProp (
  res: Object,
  hash: ?Object,
  key: string,
  altKey: string,
  preserve: boolean
): boolean {
  if (isDef(hash)) {
    // 判断 hash（props/attrs）对象中是否存在 key 或 altKey
    // 存在则设置给 res => res[key] = hash[key]
    if (hasOwn(hash, key)) {
      res[key] = hash[key]
      if (!preserve) {
        delete hash[key]
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey]
      if (!preserve) {
        delete hash[altKey]
      }
      return true
    }
  }
  return false
}
