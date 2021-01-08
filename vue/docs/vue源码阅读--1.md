# Vue 源码阅读

## new Vue()

`const APP = new Vue(options)`

### 1. `_init(options)`

1. 创建唯一标识 `this._uuid`

2. 创建阻止this被 `Observer` 实例化 `this._isVue = true`

3. 根据合并策略合并传入的组件属性 `mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm)`

4.  `initProxy(this)` 判断当前环境是否有 `Proxy`，` this._renderProxy = new Proxy(this, hanlders) || this`

5. `this._self = this`

6.  `initLifecycle(this)` 初始化生命周期，添加`$parent`、`$root`、`$children`属性

7.  `initEvents(this)` 初始化事件监听

8.  `initRender(this)` 添加虚拟 `dom` 节点，`slot` 等属性

9.  `callHook(this, "beforeCreate")` 调用 `beforeCreate` 生命周期钩子

10.  `initInjections(this)` 初始化祖先组件的注入依赖

11.  `initState(this)` 

    - `this._watcher = []` 创建新数组保存该实例中的所有 `Watcher` 实例

    - `initProps` 判断是否有 `props`，初始化 `props` 部分的数据，并对其添加观察者
    - `initMethods` 判断是否有 `methods`，初始化 `methods`
    - `initData` 判断是否有 `data` ，有就调用 `initData`初始化 `data` 数据，没有则将 `data` 作为空对象并转为响应式
    - `initComputed` 判断是否有 `computed`，初始化 `computed`
    - `initWatch` 判断是否有 `watch`，初始化 `watch`

12.  `initProvide(this)` 初始化向下注入的依赖数据

13.  `callHook(this, "created")` 调用

14.  `this.$mount(this.$options.el)`

