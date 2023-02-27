# 通过一个例子解析 Vue 3 Watch 的工作原理

## 前言

之前在一个大佬的粉丝群里看到了这样一个问题，具体代码如下：

```typescript
// reactive的案例
const user: UnwrapNestedRefs<{ name: string }> = reactive({ name: '卖鱼强' })

watch(user, (value) => console.log('第-', value)) // 有效
watch(user.name, (value) => console.log('第二', value)) // 无效
watch(() => user,(value) => console.log('第三', value)) // 无效
watch(() => user.name,(value) => console.log('第四', value)) // 有效

// ref案例
const userRef: Ref<string> = ref('卖鱼强')

watch(userRef, (value) => console.log('第一个watch', value)) // 有效
watch(userRef.value, (value) => console.log('第二个watch', value)) // 无效
watch(() => userRef, (value) => console.log('第三次watch', value)) // 无效
watch(() => userRef.value, (value) => console.log('第四次watch', value)) // 有效

user.name = '狂飙强'
userRef.value = '狂飙强'
```

疑问就是为什么有些情况下会不生效？

## `watch` 函数定义

首先我们看一下官方对 `watch` 函数参数与返回值的定义：

```typescript
// 侦听单个来源
function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): StopHandle

// 侦听多个来源
function watch<T>(
  sources: WatchSource<T>[],
  callback: WatchCallback<T[]>,
  options?: WatchOptions
): StopHandle

type WatchCallback<T> = (
  value: T,
  oldValue: T,
  onCleanup: (cleanupFn: () => void) => void
) => void

type WatchSource<T> =
  | Ref<T> // ref
  | (() => T) // getter
  | T extends object
  ? T
  : never // 响应式对象

interface WatchOptions extends WatchEffectOptions {
  immediate?: boolean // 默认：false
  deep?: boolean // 默认：false
  flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
}
```

可以看到 `watch` 方法一共有两种定义：

- 接收一个 `source` 监听的源数据，一个回调函数，与一个可选配置项，返回一个 `stop` 停止监听的方法
- 接收一个 `sources` 源数据数组，一个回调函数，与一个可选配置项，返回一个 `stop` 停止监听的方法

其最大的差别就是在 `sources` 这里，`watch` 函数**既可以监听一个响应式数据对象，也可以通过数组形式同时监听多个数据对象**。

并且，这个数据对象的类型默认只有四种情况：

1. `Ref<T>`： 一个响应式数据对象
2. `() => T`： 一个返回对象的箭头函数
3. `T extends object`： 一个响应式对象
4. 以上三种类型的组合（也就是同时监听多个数据源的情况）

不过呢在源码中其实对 `watch` 函数有多次 **重载**：

```typescript
export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T)
type MultiWatchSources = (WatchSource<unknown> | object)[]

// 1. 多个数据源，且具有 cb 回调函数
export function watch<
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: [...T],
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// 2. 监听多个数据源，但是其中有只读数据，会在参数处理时中断
export function watch<
  T extends Readonly<MultiWatchSources>,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// 3. 单个数据源，且具有 cb 回调函数
export function watch<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// 4. 监听一个响应式对象，且具有 cb 回调函数
export function watch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// 实现逻辑，调用 doWatch 创建相应的 Effect 副作用
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>
): WatchStopHandle {
  return doWatch(source as any, cb, options)
}
```

由上可见，虽然 `watch` 函数在 `ts`  的支持上对参数进行了多次限制说明，但是核心依然是使用 `doWatch` 函数来创建相应的副作用进行依赖收集和 `cb` 执行的。

## `doWatch` 函数

首先我们先看一下源码：

```js
function doWatch(source, cb, { immediate, deep, flush } = {}) {
  const instance = currentInstance
  let getter: () => any
  let forceTrigger = false
  let isMultiSource = false

  if (isRef(source)) {
    getter = () => source.value
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isArray(source)) {
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return traverse(s)
        } else if (isFunction(s)) {
          return callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER)
        }
      })
  } else if (isFunction(source)) {
    if (cb) {
      getter = () => callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER)
    }
  } else {
    getter = NOOP
  }

  // 2.x array mutation watch compat
  if (__COMPAT__ && cb && !deep) {
    const baseGetter = getter
    getter = () => {
      const val = baseGetter()
      if (
        isArray(val) &&
        checkCompatEnabled(DeprecationTypes.WATCH_ARRAY, instance)
      ) {
        traverse(val)
      }
      return val
    }
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let cleanup: () => void
  let onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
    }
  }

  let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE
  const job: SchedulerJob = () => {
    if (!effect.active) {
      return
    }
    if (cb) {
      const newValue = effect.run()
      if (
        deep ||
        forceTrigger ||
        (isMultiSource
          ? (newValue as any[]).some((v, i) => hasChanged(v, (oldValue as any[])[i]))
          : hasChanged(newValue, oldValue))
      ) {
        if (cleanup) {
          cleanup()
        }
        callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
          newValue,
          oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
          onCleanup
        ])
        oldValue = newValue
      }
    }
  }

  job.allowRecurse = !!cb
  let scheduler: EffectScheduler
  ...
  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  }

  return () => {
    effect.stop()
    if (instance && instance.scope) {
      remove(instance.scope.effects!, effect)
    }
  }
}
```

上面的代码中，从第 **7** 行直到第 **47** 行，都是在处理 `sources` 数据源的处理，最终会将其转换为一个 `getter` 函数用来创建 `ReactiveEffect` 和收集数据依赖。

在 `getter` 的处理过程中，分为以下情况：

1. `isRef(source)`：是一个 `ref` 构造的变量，`getter` 为读取该变量 `value` 值的方法，正常收集依赖
2. `isReactive(source)`：如果是 `reactive` 构造的变量，此时会默认 `deep` 为 `true`，`getter` 为读取该变量的方法，后面会通过 `traverse` 进行 **依赖收集**
3. `isFunction(source)`：（这里将函数和数组置换一下顺序）如果是函数的话，其实 `getter` 就是对该函数的调用和执行；但是，这里会通过 `callWithErrorHandling` 执行函数获取函数返回值来进行依赖收集，**最终的数据是否变化依赖的是函数的返回结果是否发生改变**
4. `isArray(source)`：数组格式的数据源配置，则是对上面三种类型数据的集合，会遍历每个数组元素进行依赖收集
5. 其他情况，默认 `getter` 为一个空函数，即 **不会依赖其他数据**，非 `immediate` 情况下 `cb` 基本上不会执行。

然后，则是上篇文章 [Vue 3 Effect 任务调度详解](https://juejin.cn/post/7204485453570768955) 中说过的 `scheduler` 调度函数处理部分，确定 `cb` 的执行时机

## 回顾问题

在了解了 `watch` 函数的具体过程之后，我们再回头来看一下上面的问题。

针对 `const user: UnwrapNestedRefs<{ name: string }> = reactive({ name: '卖鱼强' })` 的情况

- `watch(user.name, cb)` 不生效的原因是因为 `source` 为一个 **简单数据**，无法监听变量；这也侧面反应了，**`Vue` 的响应式系统都是面向对象（引用数据类型）来实现的，简单数据都无法被监听**
- `watch(() => user, cb)` 不生效的原因是因为 `source` 是一个函数，而函数都是以最终的函数返回值来确定变化的，这里返回的都是 `user` 这个对象的引用地址，修改属性是不会触发其改变的，所以不生效

针对 `const userRef: Ref<string> = ref('卖鱼强')` 的情况：

- `watch(userRef.value, cb)`  这个原因与 `watch(user.name, cb)` 的原因一样
- `watch(() => userRef, cb)` 这个原因与 `watch(() => user, cb)` 的原因一样



综上，`watch` 可以监听的数据类型总的来说只有 `Ref(ComputedRef), Reactive, Function` 这三大类或者由这三类数据组成的数组，其他类型则会被直接抛弃；而其中的 `Function` 类型，则是根据其返回值来进行依赖收集的
