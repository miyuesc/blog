/* @flow */

/**
 * web 平台的 DOM 操作 API
 */

import { namespaceMap } from 'web/util/index'

/**
 * 创建标签名为 tagName 的元素节点
 */
export function createElement (tagName: string, vnode: VNode): Element {
  // 创建元素节点
  const elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  // 如果是 select 元素，则为它设置 multiple 属性
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}

// 创建带命名空间的元素节点
export function createElementNS (namespace: string, tagName: string): Element {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

// 创建文本节点
export function createTextNode (text: string): Text {
  return document.createTextNode(text)
}

// 创建注释节点
export function createComment (text: string): Comment {
  return document.createComment(text)
}

// 在指定节点前插入节点
export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {
  parentNode.insertBefore(newNode, referenceNode)
}

/**
 * 移除指定子节点
 */
export function removeChild (node: Node, child: Node) {
  node.removeChild(child)
}

/**
 * 添加子节点
 */
export function appendChild (node: Node, child: Node) {
  node.appendChild(child)
}

/**
 * 返回指定节点的父节点
 */
export function parentNode (node: Node): ?Node {
  return node.parentNode
}

/**
 * 返回指定节点的下一个兄弟节点
 */
export function nextSibling (node: Node): ?Node {
  return node.nextSibling
}

/**
 * 返回指定节点的标签名 
 */
export function tagName (node: Element): string {
  return node.tagName
}

/**
 * 为指定节点设置文本 
 */
export function setTextContent (node: Node, text: string) {
  node.textContent = text
}

/**
 * 为节点设置指定的 scopeId 属性，属性值为 ''
 */
export function setStyleScope (node: Element, scopeId: string) {
  node.setAttribute(scopeId, '')
}
