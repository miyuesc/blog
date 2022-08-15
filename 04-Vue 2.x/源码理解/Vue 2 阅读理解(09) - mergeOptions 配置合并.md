## 1. mergeOptions 配置合并

> 这里就省略内部组件的配置合并，只是几个简单属性的合并，源码位于 **src/core/util/options.ts** 

```javascript
const strats = config.optionMergeStrategies
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined ? parentVal : childVal
}

export function mergeOptions(parent: Record<string, any>,child: Record<string, any>,vm?: Component | null): ComponentOptions {
  if (__DEV__) {
    checkComponents(child)
  }

  if (isFunction(child)) {
    child = child.options
  }

  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirectives(child)

  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options: ComponentOptions = {} as any
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField(key: any) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

整个过程首先校验了 **child** 中的组件命名配置，并且如果传入的 child 是一个函数的话，则直接获取 **child.options** 重新赋值给 **child**  作为后面的合并项。

然后，会格式化 **child** 的 **props, inject, directives** 三项配置，将其处理为标准的 **对象格式**。

之后，则是遍历 **child** 的 **extends** 和 **mixins** 配置，依次调用 **mergeOptions** 方法，将所有配置全部合并到 **parent** 中。

最后，则是遍历 **parent** 和 **child**，将所有的配置项组合到一个新的配置项对象 **options** 中并返回。

> 这里遍历 **child** 在 遍历 **parent** 之后，所以最终的配置项都是 **以 Child 配置为主，不存在的配置则使用 Parent 的配置项**
>
> parent 与 child 之间的同配置项合并可以通过在 **Vue.config.optionMergeStrategies** 中配置对应的处理函数来配置自定义合并。

## 2. defaultStrats 默认合并策略

在该模块的顶部，定义了一个空对象 **strats = config.optionMergeStrategies** 用来保存内部配置的合并策略，并在后面重新定义每个配置项的合并策略，避免默认的 data，methods 类型等配置的合并策略被覆盖。

```typescript
const strats = config.optionMergeStrategies

const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined ? parentVal : childVal
}

if (__DEV__) {
  strats.el = strats.propsData = function (parent: any, child: any, vm: any, key: any) {
  }
}

strats.data = function (parentVal: any, childVal: any, vm?: Component): Function | null {
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeLifecycleHook
})

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

strats.watch = function (
  parentVal: Record<string, any> | null,
  childVal: Record<string, any> | null,
  vm: Component | null,
  key: string
): Object | null {
}

strats.props =
  strats.methods =
  strats.inject =
  strats.computed =
    function (parentVal: Object | null, childVal: Object | null, vm: Component | null, key: string): Object | null {}

strats.provide = mergeDataOrFn
```

以上部分分别定义了以下几个部分的合并策略：

- **mergeData**：会遍历 parent 的 data 对象 （如果是函数的话，会重新赋值为函数的返回值），并区分以下情况
  1. parent 中有 child 中没有的属性，则将该属性进行响应式处理并赋给 child
  2. parent 与 child 都有但是两者的值不相等，且都是对象的时候，会继续遍历两个对象执行合并方法
  3. 排除以上情况，则都以 child 中的配置为准
- **mergeLifecycleHook** ：生命周期合并策略，会将组件内的生命周期钩子函数配置转为数组格式，然后将所有的生命周期配置函数合并到一个数组中
- **mergeAssets**：资源合并策略，主要合并 components，directives，filter 配置，一样是以 child 配置覆盖 parent 配置
- **mergeWatch**：合并 watch 监听配置，与生命周期合并类似，同名属性监听会将监听函数放置到数组中顺序执行
- **mergeOther**：合并 props，inject，methods 等配置，与资源合并策略类似，同名配置以 child 为准
- **mergeProvide**：合并注入数据，采用与 mergeData 一样的合并策略

> 在定义 strats 之后还定义了 **strats.el** 和 **strats.propsData** 的合并策略，但是内部使用的还是 **defaultStrat**，只是增加了一层校验，警告只能在 new Vue 的时候使用定义这些配置。





