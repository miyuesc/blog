## initLifecycle 生命周期初始化

在 **new Vue 过程** 一节中，讲到 Vue 实例在初始化的时候会执行 **_init()** 方法。其中首先是执行配置的标准化与配置合并 **MergeOptions**

在配置合并完成之后，就会调用 **initLifecycle(vm)** 来进行实例声明周期的初始化了。

**initLifecycle** 方法的代码与定义 Vue 构造函数时候使用的 **lifecycleMixin** 方法在同一个文件下，位于 src/core/instance/lifecycle.ts

```typescript
export function initLifecycle(vm: Component) {
  const options = vm.$options
  
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._provided = parent ? parent._provided : Object.create(null)
  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
```

> **vm.$options** 就是合并后的完整配置

这里有一段查找 **parent** 实例的代码

```typescript
let parent = options.parent
if (parent && !options.abstract) {
  while (parent.$options.abstract && parent.$parent) {
    parent = parent.$parent
  }
  parent.$children.push(vm)
}
vm.$parent = parent
```

这里的核心逻辑就是：如果 **当前的组件不是抽象组件** 并且 **具有父级组件配置**，就从 **options** 配置中向上层查找，直到找到第一个 **不是抽象组件** 的实例，在该实例的 **$children** 子实例数组中插入当前实例。并更新当前实例的父元素实例为那个非抽象实例。

