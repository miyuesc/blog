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

**这里有一段查找 parent 实例的代码**

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

**然后会绑定这个组件关系里面的根组件** **root**

```typescript
vm.$root = parent ? parent.$root : vm
```

这里其实也好理解。因为组件的实例化过程是从 **最外层模板向内解析** ，当开始处理当前的实例的时候，如果存在父级，那么父级组件实例绑定的根组件实例一定也是当前实例的根组件。如果连父组件实例都没有的话，那么当前组件一定是在最外层，所以它自己就是根组件（这里把 $root 指向自身，也是为了子组件实例能够正确的获取到根组件实例）。

**最后，则是初始化一些组件注入数据、监听依赖，和组件的生命周期标志**

```typescript
vm.$children = [] // 子组件实例数组
vm.$refs = {} // refs 绑定数据，包括 dom 实例和组件实例

vm._provided = parent ? parent._provided : Object.create(null) // 上层注入的数据
vm._watcher = null
vm._inactive = null
vm._directInactive = false
vm._isMounted = false  // 生命周期标识
vm._isDestroyed = false
vm._isBeingDestroyed = false
```

