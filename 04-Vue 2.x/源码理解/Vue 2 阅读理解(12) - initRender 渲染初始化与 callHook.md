## initRender 组件渲染初始化

在 **initEvents** 事件系统初始化完成之后，紧接着的就是组件实例的渲染部分的初始化 **initRender**。

**initRender** 函数定义位于 **src/core/instance/render.ts** 文件内，基本定义如下：

```typescript
export function initRender(vm: Component) {
  vm._vnode = null
  vm._staticTrees = null
  const options = vm.$options
  const parentVnode = (vm.$vnode = options._parentVnode!)
  const renderContext = parentVnode && (parentVnode.context as Component)
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = parentVnode
    ? normalizeScopedSlots(vm.$parent!, parentVnode.data!.scopedSlots, vm.$slots)
    : emptyObject
  
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
  
  const parentData = parentVnode && parentVnode.data
  
  if (__DEV__) {
    defineReactive(
      vm,
      '$attrs',
      (parentData && parentData.attrs) || emptyObject,
      () => !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm),
      true
    )
    defineReactive(
      vm,
      '$listeners',
      options._parentListeners || emptyObject,
      () => !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm),
      true
    )
  } else {
    // 将 defineReactive 的第四个参数设为 null 重新执行上面的步骤，即省略校验和报错部分
  }
}
```

这部分其实比较好理解：

1. 首先是 **清空** 组件的 VNode 对象和静态dom节点树；并获取到该实例的 **父组件虚拟dom树对象 parentVnode** 与 **父组件实例指向 renderContext**
2. 然后是处理 **当前组件的 slots 插槽对象** ，以及标准化处理组件的数据域插槽
3. 给组件添加两个 **组件创建方法**，但是这两个方法有细微差别：
   - **_c** 表示使用内部 render 函数，不需要额外的标准化处理
   - **$createElement** 则表示使用的是用户自己编写的 render 函数，需要内部重新进行一次标准化处理
   - 这两个方法最终其实都是调用的 **_createElement** 方法，只是标准函数（即 **_c**）使用 **simpleNormalizeChildren()** 处理，而用户自定义 render （即 **$createElement**）使用 **normalizeChildren()** 处理
4. 最后对 **$attrs** 和 **$listeners** 进行响应式处理。这一步主要是为了提供给高阶组件使用，当使用 **$attrs** 和 **$listeners** 进行绑定数据与事件透传时，可以正确触发高阶组件内部的状态更新。

整个过程其实就是解析了组件的 **options** 配置项与父组件的绑定参数，并对插槽和数据域插槽进行不同处理，最后给组件添加 **_createElement** 的事件指向绑定，并响应式处理两个组件内部没有直接定义的参数/事件。



## callHook('beforeCreate')

因为这部分篇幅较少，所以把 **callHook()** 方法也一并看了。

这个方法从名字上就可以看出，是用来触发生命周期钩子的回调函数。在之前的 **mergeOptions 配置合并** 中已经知道，Vue 组件在实例化的时候会对 **options** 中的生命周期钩子函数定义进行标准化处理，最后每个生命周期对应的都是一个 **函数数组**（如果有定义了钩子函数的话）。 

该方法的定义如下：

```typescript
export function callHook(vm: Component, hook: string, args?: any[], setContext = true) {
  pushTarget()
  const prev = currentInstance
  setContext && setCurrentInstance(vm)
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, args || null, vm, info)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  setContext && setCurrentInstance(prev)
  popTarget()
}
```

这里可以分成一下几步来理解：

1. **pushTarget()**：在组件的 Dep 依赖中插入一个 undefined 元素并将当前依赖指向设置为 undefined，**来禁止生命周期钩子函数执行时的依赖收集**
2. 遍历 **options** 中对应的钩子函数数组，调用 **invokeWithErrorHandling** 来执行（这里其实与 **initEvnets** 中注册组件事件的方法是一致的）
3. 如果 **_hasHookEvent** 为 **true**，即父组件有设置子组件的生命周期监听函数，则用 **$emit** 抛出对应生命周期事件
4. **popTarget()**：删除之前插入的 undefined 元素，并恢复 Dep 依赖对象中的依赖收集效果
5. 两个 **setCurrentInstance**：这部分则是为了适配 V3 的写法而新增的部分，主要是保证在生命周期的钩子函数中使用 **getCurrentInstance()** 方法获取当前组件实例时能正确获取到当前的组件状态，但是在钩子函数执行完之后会恢复到之前的状态



