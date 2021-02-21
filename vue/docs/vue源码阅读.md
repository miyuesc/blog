# Vue源码阅读

> 本文内容基于 Vue 2.6.12，主要解析需要编译的运行时部分。
>
> 最外层打包入口（主文件入口）位于 `vue-dev/src/platforms/web/entry-runtime-with-compiler.js`

## 1. `Vue` 构造函数初始化

### 1.1 `function Vue(options)`

定义构造函数，并检查是否使用 `new` 关键字调用。

### 1.2 `initMixin(Vue)`

为 `Vue.prototype` 原型上添加 `_init(options)` 的方法，以供组件实例化的时候调用。

### 1.3 `stateMixin(Vue)`

重新定义原型下的 `$data` 与 `$props` 的 `get(), set(newValue)` 的方法。为 `Vue.prototype` 添加 `$set(target, key, val)` 、`$delete(target, key)` 与 `$watch(expOrFn, cb, options)` 方法。

### 1.4 `eventsMixin(vue)`

为 `Vue.prototype` 原型上添加 `$on(event, fn)` 、`$once(event, fn)` 、`$off(event, fn)` 与 `$emit(event, fn)` 方法。

在使用 `$on` 注册事件的时候，会将 `.vue` 文件中对应的生命周期的方法 `push` 到当前组件 `vm._events[event]` 中（`event` 是对应的事件的名称标识），如果 `.vue` 中确实定义了某个生命周期对应的处理函数，则还会在当前组件下定义一个标识符 `vm._hasHookEvent = true`

`$off` 在传入参数为空时，会将 `vm.events` 置为 `null`，清除当前组件的所有定义的事件。

`$emit` 在注册事件的时候，会判断非生产环境下提示将*非小写事件名*转换成*小写事件名与短横线连接（`kebab-case`）*的格式，因为 `html` 对大小写不敏感。

> `$on(), $off()` 传入参数 `event` 可以是数组，内部会遍历数组重新调用 `$on(), $off()`，走非数组（即只有一个事件定义）处理过程。

### 1.5 `lifecycleMixin(Vue)` 

为 `Vue.prototype` 原型上添加 `_update(vnode, hydrating)` 、`$forceUpdate()` 与 `$destroy()` 方法。

`_update` 方法会获取组件的挂载元素，以及组件原来的虚拟节点 `vm._vnode` （根据组件是否存在 `_vnode` 来判断是否首次渲染），调用 `__patch__` 方法将对比虚拟节点的修改，然后后更新为对应的真实 `dom` 节点，并更新到组件的 `$el` 属性上；之后将新产生的虚拟节点更新到组件上；如果组件的父组件是一个高阶组件，则还会继续更新父元素的 `$el` 属性，将值设置为当前组件的 `$el`。

`$forceUpdate` 则是判断组件下是否存在观察者 `watcher`，调用 `watcher` 的 `update()` 方法来触发更新。

`$destory` 首先会判断组件的销毁状态对应的标志位 `_isBeingDestroyed`，为真时直接返回不再继续执行后续代码；为假时则继续执行，触发 `beforeDestroy` 生命周期钩子函数，并将标志位置为 `true`，表示已经执行过销毁方法。之后在父组件的 `children` 中移除该组件（父组件未被销毁且不是抽象组件时执行），接着移除所有观察者 `watchers` 与相关的依赖；然后设置组件销毁结束状态 `vm._isDestroyed = true`，执行 `vm.__patch__(vm._vnode, null)` 来销毁对应的真实节点，触发 `destroyed` 生命周期钩子函数；最后移除所有事件，修改组件的相关属性为 `null`。

### 1.6 `renderMixin(Vue)` 

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

### 1.7 初始化全局API

这个过程中，会首先为 `Vue` 构造函数添加 `util, set, delete, nextTick, observable` 这些全局方法，并注册一个全局组件 `keep-alive`。

`Vue.util` 包含 `warn, extend, mergeOptions, defineReactive` 四个方法，但是不包含在文档中。

在构造函数下还有一个 `options` 属性，包含 `component, directive, filter, _base` 几个属性，其中 `_base` 指向构造函数本身。

#### 1.7.1 `initUse(Vue)`

定义 `Vue.use(plugin)` 方法，用于安装插件。

#### 1.72 `initMixin(Vue)`

与 1.2 `initMixin(Vue)` 不同，这里主要定义 `Vue.mixin(mixin)` 混入方法。

> 在打包后的 `vue.js` 中，代码位于 `function initMixin$1(Vue){}` 中，源码位于 `src/core/global-api/mixin.js`

#### 1.7.3 `initExtend(Vue)`

定义 `Vue.extend(extendOptions)` 方法，提供 “使用 `Vue.extend` 基础构造方法来创建一个组件" 的功能（`ElementUI` 的 `message` 组件就是采用的这种方式）。

#### 1.7.4 `initAssetRegister(Vue)`

主要定义 `Vue.component(id, definition)`、`Vue.directive(id, definition)`、`Vue.filter(id, definition)` 三个方法，主要用于定义全局的组件、指令、过滤器。

在任意一个地方使用这三个方法时，都需要传入 `id` 与 `definition（组件定义部分）` ，如果定义部分未传，则会直接返回 Vue 内部与传入 `id` 一致的内置组件，否则返回 `undefined`。

`Vue.component(id, definition)`：首先对 `id` 和定义部分进行合法性检查，之后调用 `Vue.extend()` （源码是调用的 `this.options._base.extend(definition)`）来完善这个组件。

`Vue.directive(id, definition)`：首先判断传入定义是否为函数，是函数则修改定义的格式为规定格式（对象 `{ bind: definition, update: definition` }）

最后生成的这些产物都会作为 `Vue` 构造函数的一个子属性，挂载在 `Vue.options[ASSET_TYPE + 's'][id] = definition`， 注意这里的 `definition` 是验证修改后的合法格式的定义。

> 源码中使用遍历 `ASSET_TYPES` 的方式来定义三个方法，分别用于创建全局组件实例、全局指令实例与全局过滤器指令。

> `Vue` 在初始化构造函数时还定义了其他方法，这里不多做表述。

### 1.8 `__patch__`

基于Snabbdom的虚拟DOM修补算法。

### 1.9 `$mount`

定义了公共的挂载方法。

## 2. `new Vue()` 创建 `Vue` 实例

`const APP = new Vue(options)`

> 在存在组件时，也是由根节点 `APP` 开始解析的

### 2.1 `_init(options)`

1. 创建唯一标识 `vm._uuid`
2. 设置阻止当前组件被 `Observer` 观察者实例化的标志位 `vm._isVue = true`
3. 根据合并策略合并传入的组件属性，最终集合到 `vm.$options` 上
   - `Vue`内部组件（`options._isComponent === true`）, 使用 `initInternalComponent(vm, options)`
   - `mergeOptions(resolveConstructorOptions(vm.constructor),options || {},vm)`，利用合并策略合并传入参数，并修改为指定格式
4. `initProxy(vm)` 判断当前环境是否是生产环境，是否有 `Proxy`，来配置对应的渲染函数的代理。` this._renderProxy = new Proxy(vm, hanlders) || vm`
5. `this._self = vm` 暴露当前实例
6. `initLifecycle(vm)` 初始化生命周期，添加`$parent`、`$root`、`$children` 等属性
   1. 定位第一个非抽象类父组件或者祖先组件，作为父组件：`vm.$parent = parent`，并将当前组件 `push` 到父组件的 `children` 数组中
   2. 判断父组件是否是 `root` 组件，初始化 `$root` ：`vm.$root = parent? parent.$root : vm`
   3. 添加 `$children` 属性，并初始化一个空数组
   4. 添加 `$refs` 属性，并初始化一个空对象
   5. `vm._watcher = null`
   6. `vm._inactive = null`
   7. `vm._directInactive = null`
   8. `vm._isMounted = null` 标志是否已经触发过 `Mounted` 钩子函数
   9. `vm._isDestroyed = null` 标志组件是否已经被销毁
   10. `vm._isBeingDestroyed = null` 标志位，为 `true` 则不会继续触发 `beforeDestroy` 和 `destroyed` 钩子函数
7. `initEvents(vm)` 初始化事件监听
   1. 给组件实例添加 `vm._events` 属性，并初始化为空 `vm._events = Object.create(null)`
   2. 添加 `vm._hasHookEvent` 属性，标识是否存在生命周期钩子的相关事件，初始化为 `false` （使用布尔值可以直接判断，减少性能开销）
   3. 根据父组件是否存在监听器来更新组件的事件 `if (vm.$options._parentListeners) updateComponentListeners(vm, vm.$options._parentListeners)`
8. `initRender(vm)` 添加虚拟 `dom` 节点，`slot` 等属性
   1. 为组件实例设置属性 `_vnode` 子节点树的虚拟根节点和 `_staticTrees` 单次渲染的缓存树的初始值为 `null`
   2. 
9. `callHook(vm, "beforeCreate")` 调用 `beforeCreate` 生命周期钩子
10. `initInjections(this)` 初始化祖先组件的注入依赖
11. `initState(vm)` 
    - `this._watcher = []` 创建新数组保存该实例中的所有 `Watcher` 实例
    - `initProps` 判断是否有 `props`，初始化 `props` 部分的数据，并对其添加观察者
    - `initMethods` 判断是否有 `methods`，初始化 `methods`
    - `initData` 判断是否有 `data` ，有就调用 `initData`初始化 `data` 数据，没有则将 `data` 作为空对象并转为响应式
    - `initComputed` 判断是否有 `computed`，初始化 `computed`
    - `initWatch` 判断是否有 `watch`，初始化 `watch`
12. `initProvide(vm)` 初始化向下注入的依赖数据
13. `callHook(vm, "created")` 调用声明周期钩子函数
14. `vm.$mount(this.$options.el)` 将组件挂载到对应的Dom节点下，在这一步之前会判断传入的 `options` 是否有 `el` 属性，

