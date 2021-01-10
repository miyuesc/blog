# Vue 源码阅读

## 1. `Vue` 初始化原型属性和方法

### 1.1 `initMixin(Vue)`

为 `Vue.prototype` 原型上添加 `_init(options)` 的方法。



### 1.2 `stateMixin(Vue)`

重新定义原型下的 `$data` 与 `$props` 的 `get(), set(newValue)` 的方法。为 `Vue.prototype` 添加 `$set(target, key, val)` 、`$delete(target, key)` 与 `$watch(expOrFn, cb, options)` 方法。



### 1.3 `eventsMixin(vue)`

为 `Vue.prototype` 原型上添加 `$on(event, fn)` 、`$once(event, fn)` 、`$off(event, fn)` 与 `$emit(event, fn)` 方法。

> `$on(), $off()` 传入参数 `event` 可以是数组，内部会遍历数组重新调用 `$on(), $off()`。



### 1.4 `lifecycleMixin(Vue)` 

为 `Vue.prototype` 原型上添加 `_update(vnode, hydrating)` 、`$forceUpdate()` 与 `$destroy()` 方法。



### 1.5 `renderMixin(Vue)` 

调用 `installRenderHelpers(Vue.prototype)` 为 `Vue.prototype` 原型上添加渲染相关方法：

1. `Vue.prototype._o`: `markOnce` -- `v-once` 解析助手，会将当前节点标记为静态节点
2. `Vue.prototype._n`: `toNumber` -- 将输入值转换为数字。如果转换失败，则返回原始字符串。
3. `Vue.prototype._s`: `toString` -- 将值转换为实际显示的字符串
4. `Vue.prototype._l`: `renderList` -- `v-for` 解析助手
5. `Vue.prototype._t`: `renderSlot` -- `<slot>` 标签解析助手
6. `Vue.prototype._q`: `looseEqual` -- 检测两个值是否相同
7. `Vue.prototype._i`: `looseIndexOf` -- 返回数组中检查到的第一个与 val 相同的值的下标
8. `Vue.prototype._m`: `renderStatic` -- 渲染静态 `dom` 树的辅助程序
9. `Vue.prototype._f`: `resolveFilter` -- 过滤器解析程序
10. `Vue.prototype._k`: `checkKeyCodes` -- `config.keyCode` 检测
11. `Vue.prototype._b`: `bindObjectProps` -- `v-bind` 合并到 `VNode` 的辅助程序
12. `Vue.prototype._v`: `createTextVNode` -- 创建普通的文本虚拟节点
13. `Vue.prototype._e`: `createEmptyVNode` --  创建空虚拟节点
14. `Vue.prototype._u`: `resolveScopedSlots` -- 反向代理 `slot` 插槽
15. `Vue.prototype._g`: `bindObjectListeners` -- 处理 `v-on` 绑定的监听程序
16. `Vue.prototype._d`: `bindDynamicKeys`
17. `Vue.prototype._p`: `prependModifier` -- 事件修饰符标记动态添加到事件上

为 `Vue.prototype` 添加 `$nextTick()` 、`_render()` 方法。



### 1.6 初始化全局API

#### 1.6.1 `initUse(Vue)`

定义 `Vue.use(plugin)` 方法，用于安装插件。



#### 1.6.2 `initMixin(Vue)`

与 1.1 `initMixin(Vue)` 不同，这里主要定义 `Vue.mixin(mixin)` 混入方法。

> 在打包后的 `vue.js` 中，代码位于 `function initMixin$1(Vue){}` 中，源码位于 `src/core/global-api/mixin.js`



#### 1.6.3 `initExtend(Vue)`

定义 `Vue.extend(extendOptions)` 方法，提供 使用 `Vue` 基础构造方法来创建一个组件。



#### 1.6.4 `initAssetRegister(Vue)`

主要定义 `Vue.component(id, definition)`、`Vue.directive(id, definition)`、`Vue.filter(id, definition)` 三个方法。

> 源码中使用遍历 `ASSET_TYPES` 的方式来定义三个方法，分别用于创建全局组件实例、全局指令实例与全局过滤器指令。



> `Vue` 在初始化构造函数时还定义了其他方法，这里不多做表述。



## 2. `new Vue()` 创建 `Vue` 实例

`const APP = new Vue(options)`

### 2.1 `_init(options)`

1. 创建唯一标识 `this._uuid`
2. 创建阻止this被 `Observer` 实例化 `this._isVue = true`
3. 根据合并策略合并传入的组件属性，最终集合到 `vm.$options` 上
   - `Vue`内部组件（`options._isComponent === true`）, 使用 `initInternalComponent(vm, options)`
   - `mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm)`
4. `initProxy(this)` 判断当前环境是否有 `Proxy`，` this._renderProxy = new Proxy(this, hanlders) || this`
5. `this._self = this` 暴露当前实例
6. `initLifecycle(this)` 初始化生命周期，添加`$parent`、`$root`、`$children` 等属性
   1. 定位第一个非抽象类父组件或者祖先组件，作为父组件：`vm.$parent = parent`
   2. 判断父组件是否是 `root` 组件，初始化 `$root` ：`vm.$root = parent? parent.$root : vm`
   3. 添加 `$children` 属性，并初始化一个空数组
   4. 添加 `$refs` 属性，并初始化一个空对象
   5. `vm._watcher = null`
   6. `vm._inactive = null`
   7. `vm._directInactive = null`
   8. `vm._isMounted = null` 标志是否已经触发过 `Mounted` 钩子函数
   9. `vm._isDestroyed = null` 标志组件是否已经被销毁
   10. `vm._isBeingDestroyed = null` 标志位，为 `true` 则不会继续触发 `beforeDestroy` 和 `destroyed` 钩子函数
7. `initEvents(this)` 初始化事件监听
   1. 添加 `vm._events` 属性，并初始化为空 `vm._events = Object.create(null)`
   2. 添加 `vm._hasHookEvent` 属性，初始化为 `false`
   3. 根据父组件是否存在监听器来更新组件的事件 `if (vm.$options._parentListeners) updateComponentListeners(vm, vm.$options._parentListeners) `
   4. 
8. `initRender(this)` 添加虚拟 `dom` 节点，`slot` 等属性
9. `callHook(this, "beforeCreate")` 调用 `beforeCreate` 生命周期钩子
10. `initInjections(this)` 初始化祖先组件的注入依赖
11. `initState(this)` 

    - `this._watcher = []` 创建新数组保存该实例中的所有 `Watcher` 实例

    - `initProps` 判断是否有 `props`，初始化 `props` 部分的数据，并对其添加观察者
    - `initMethods` 判断是否有 `methods`，初始化 `methods`
    - `initData` 判断是否有 `data` ，有就调用 `initData`初始化 `data` 数据，没有则将 `data` 作为空对象并转为响应式
    - `initComputed` 判断是否有 `computed`，初始化 `computed`
    - `initWatch` 判断是否有 `watch`，初始化 `watch`
12. `initProvide(this)` 初始化向下注入的依赖数据
13. `callHook(this, "created")` 调用
14. `this.$mount(this.$options.el)`

