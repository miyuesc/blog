# Vue 源码阅读

## `new Vue()`

### `const APP = new Vue（options）`

#### 1. `_init(options)`

1. 创建唯一标识 `this._uuid`
2. 创建阻止this被 `Observerd` 实例化 `this._isVue = true`
3. 根据合并策略合并传入的组件属性 `mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm)`
4.  `initProxy(this)` 判断当前环境是否有 `Proxy`，` this._renderProxy = new Proxy(this, hanlders) || this`
5. `this._self = this`
6.  `initLifecycle(this)` 初始化生命周期，添加`$parent`、`$root`、`$children`属性
7.  `initEvents(this)` 初始化事件监听
8.  `initRender(this)` 添加虚拟 `dom` 节点，`slot` 等属性
9.  `callHook(this, "beforeCreate")` 调用 `beforeCreate` 生命周期钩子
10.  `initInjections(this)`
11.  `initState(this)`
12.  `initProvide(this)`
13.  `callHook(this, "created")`
14.  `this.$mount(this.$options.el)`

