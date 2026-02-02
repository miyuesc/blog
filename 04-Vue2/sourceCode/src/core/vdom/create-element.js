/* @flow */

import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'
import { traverse } from '../observer/traverse'

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject,
  isPrimitive,
  resolveAsset
} from '../util/index'

import {
  normalizeChildren,
  simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

/**
 * 生成组件或普通标签的 vnode，一个包装函数，不用管
 * wrapper function for providing a more flexible interface
 * without getting yelled at by flow
 */
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  // 执行 _createElement 方法创建组件的 VNode
  return _createElement(context, tag, data, children, normalizationType)
}

/**
 * 生成 vnode，
 *   1、平台保留标签和未知元素执行 new Vnode() 生成 vnode
 *   2、组件执行 createComponent 生成 vnode
 *     2.1 函数式组件执行自己的 render 函数生成 VNode
 *     2.2 普通组件则实例化一个 VNode，并且在其 data.hook 对象上设置 4 个方法，在组件的 patch 阶段会被调用，
 *         从而进入子组件的实例化、挂载阶段，直至完成渲染
 * @param {*} context 上下文
 * @param {*} tag 标签
 * @param {*} data 属性 JSON 字符串
 * @param {*} children 子节点数组
 * @param {*} normalizationType 节点规范化类型
 * @returns VNode or Array<VNode>
 */
export function _createElement(
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  if (isDef(data) && isDef((data: any).__ob__)) {
    // 属性不能是一个响应式对象
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    // 如果属性是一个响应式对象，则返回一个空节点的 VNode
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
  if (!tag) {
    // 动态组件的 is 属性是一个假值时 tag 为 false，则返回一个空节点的 VNode
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // 检测唯一键 key，只能是字符串或者数字
  // warn against non-primitive key
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      )
    }
  }

  // 子节点数组中只有一个函数时，将它当作默认插槽，然后清空子节点列表
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
  // 将子元素进行标准化处理
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }

   /**
   * 这里开始才是重点，前面的都不需要关注，基本上是一些异常处理或者优化等
   */

  let vnode, ns
  if (typeof tag === 'string') {
    // 标签是字符串时，该标签有三种可能：
    //   1、平台保留标签
    //   2、自定义组件
    //   3、不知名标签
    let Ctor
    // 命名空间
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) {
      // tag 是平台原生标签
      // platform built-in elements
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
        // v-on 指令的 .native 只在组件上生效
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }
      // 实例化一个 VNode
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // tag 是一个自定义组件
      // 在 this.$options.components 对象中找到指定标签名称的组件构造函数
      // 创建组件的 VNode，函数式组件直接执行其 render 函数生成 VNode，
      // 普通组件则实例化一个 VNode，并且在其 data.hook 对象上设置了 4 个方法，在组件的 patch 阶段会被调用，
      // 从而进入子组件的实例化、挂载阶段，直至完成渲染
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // 不知名的一个标签，但也生成 VNode，因为考虑到在运行时可能会给一个合适的名字空间
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
     // tag 为非字符串，比如可能是一个组件的配置对象或者是一个组件的构造函数
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
  // 返回组件的 VNode
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS(vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force)
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings(data) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}
