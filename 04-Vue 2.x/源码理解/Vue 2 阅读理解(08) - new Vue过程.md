## new Vue() 过程

不管是在脚手架创建的 Vue 单页应用里面，还是通过 CDN 等方式直接在 JavaScript 中使用，首先都是要创建一个 Vue 实例。

在 **new Vue()** 的过程中，执行的其实只有一个方法，就是之前定义的 **Vue.prototype._init**。

```typescript
Vue.prototype._init = function (options?: Record<string, any>) {
  const vm: Component = this
  vm._uid = uid++

  vm._isVue = true
  vm.__v_skip = true
  // Vue 2.7 新增
  vm._scope = new EffectScope(true)
  // 配置合并
  if (options && options._isComponent) {
    initInternalComponent(vm, options as any)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor as any),
      options || {},
      vm
    )
  }

  if (__DEV__) {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }

  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate', undefined, false /* setContext */)
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```

> 注：上面的代码省略掉了 性能分析的部分。

这几个部分其实很好理解：

1. 首先是设置实例的基础属性，比如 uid，Vue组件标识，自身引用等
2. 合并 **options** 配置项，这里会区分该实例是不是一个内部组件（keep-alive ，translation 等），调用不同的合并策略
3. 配置实例的 **_renderProxy** 属性，开发环境下会判断是否有 **Proxy** 方法，主要用来解析和提示 **Render** 过程中的一些问题
4. **initLifecycle**：定义当前实例的父组件、子组件等实例属性、定义当前实例的监听器依赖属性 **_watcher**、定义当前实例的生命周期标志 **_isMounted** 等
5. **initEvents**：根据父组件配置的事件来注册实例的 **_events**，并判断是否有生命周期的监听函数
6. **initRender**：定义组件实例渲染相关的信息：
>   - `_vnode，_staticTrees，$vnode，$slots，$scopedSlots` 虚拟dom属性
>   - `_c，$createElement` 元素创建方法
>   - 通过 **Object.defineProperty** 定义 **$listeners，$attrs** 为只读状态，在执行 set 操作时报错(开发环境)

7. **callHook(vm, 'beforeCreate')**：触发 **beforeCreate**，执行对应的钩子函数

8. **initInjections**：初始化注入数据，

   > 这一步会暂时关闭 **observer** 方法的数据响应化处理，并且遍历上层组件的 **provide** 数据来进行赋值，然后通过 **defineReactive** 来代理到实例上保证直接访问。这期间会校验上层组件的 **provide** 数据中是否有 **inject** 依赖的数据，没有则抛出错误。最后会重新开启 **observer** 的数据处理

9. **initState**：这一步就是处理数据、方法和监听器等

   > 1. **initProps**：这里会校验组件 props 配置，避免使用 **key, ref, slot** 这样的保留字段；并根据父组件配置的值设置相应 prop，只有当从父组件配置中获取的 prop 的值为 **undefined** 的时候才会使用组件props配置的默认值
   > 2. **initSetup**：这是 2.7 新增的配置，在 setup 返回的是函数的时候，会直接将组件的 render 属性配置为该返回函数，**所以 setup 返回的 render 函数优先级高于 template**；而如果返回值是对象，则会判断是否属于 VNode，属于则报错，不属于则对返回值进行 Ref 响应式处理
   > 3. **initMethods**：这里只是简单校验 methods 中的方法名是否合法或者与 props 配置冲突，然后将方法绑定到实例上
   > 4. **initData**：这里会判断是否有 data 配置，没有的话则会默认生成一个空对象来进行响应式处理；有的话则校验是否是一个函数，并获取函数返回值，然后遍历返回值中的对象的 key 与上文的 props、methods 对比，避免重复声明；最后将其每个属性代理到实例的 **_data** 上，并将其响应化
   > 5. **initComputed**：初始化当前实例的计算属性，并且遍历该配置对象来为每个 key 创建一个 **lazy** 状态的 **Watcher** 实例，并且也会将其代理到实例上以便直接访问。这里一样会校验配置对象的key是否与其他几个配置重复
   > 6. **initWatch**：这里就是简单的处理 watch 配置，之后利用实例的 **$watch** 来设置属性监听

10. **initProvide**：这里就是处理该组件的下级组件注入数据，如果是函数的话则会重新将内部的 this 指向当前实例

11. **callHook(vm, 'created')**：触发 **created**，执行对应的钩子函数

12. **$mount($options.el)**：判断组件的挂载元素，执行 VNode、dom 等构建方法，并更新到 el 对应的dom节点上。

