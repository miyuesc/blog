/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * 一个 dep 对应一个 obj.key
 * 在读取响应式数据时，负责收集依赖，每个 dep（或者说 obj.key）依赖的 watcher 有哪些
 * 在响应式数据更新时，负责通知 dep 中那些 watcher 去执行 update 方法
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  // 在 dep 中添加 watcher
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 像 watcher 中添加 dep
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  /**
   * 通知 dep 中的所有 watcher，执行 watcher.update() 方法
   */
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    // 遍历 dep 中存储的 watcher，执行 watcher.update()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

/**
 * 当前正在执行的 watcher，同一时间只会有一个 watcher 在执行
 * Dep.target = 当前正在执行的 watcher
 * 通过调用 pushTarget 方法完成赋值，调用 popTarget 方法完成重置（null)
 */
Dep.target = null
const targetStack = []

// 在需要进行依赖收集的时候调用，设置 Dep.target = watcher
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

// 依赖收集结束调用，设置 Dep.target = null
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
