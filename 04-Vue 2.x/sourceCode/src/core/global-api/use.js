/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  /**
   * 定义 Vue.use，负责为 Vue 安装插件，做了以下两件事：
   *   1、判断插件是否已经被安装，如果安装则直接结束
   *   2、安装插件，执行插件的 install 方法
   * @param {*} plugin install 方法 或者 包含 install 方法的对象
   * @returns Vue 实例
   */
  Vue.use = function (plugin: Function | Object) {
    // 已经安装过的插件列表
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 判断 plugin 是否已经安装，保证不重复安装
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // 将 Vue 实例放到第一个参数位置，然后将这些参数传递给 install 方法
    const args = toArray(arguments, 1)
    args.unshift(this)

    if (typeof plugin.install === 'function') {
      // plugin 是一个对象，则执行其 install 方法安装插件
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 执行直接 plugin 方法安装插件
      plugin.apply(null, args)
    }
    // 在 插件列表中 添加新安装的插件
    installedPlugins.push(plugin)
    return this
  }
}
