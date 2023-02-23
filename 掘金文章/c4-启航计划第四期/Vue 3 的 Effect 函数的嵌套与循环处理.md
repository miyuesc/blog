# Vue 3 的 Effect 函数的嵌套与循环处理

我正在参加「掘金·启航计划」

## 前言

在之前的 [Vue2与Vue3响应式原理与依赖收集详解](https://juejin.cn/post/7202454684657107005) 一文中，我们讲述了 Vue 2 与 Vue 3 在实现数据响应式处理的设计思路与他们的不同之处，也分析了 Vue 3 是如何进行数据操作拦截和依赖收集的。

与 Vue 2 比较起来，除了数据拦截部分变成了 `Proxy` 代理，依赖收集时也将 `Watcher` 替换成了 `Effect`。

但是 Vue 3 中的 `Effect` 函数中是可以进行 **`Effect`  嵌套和数据更新操作的**，本文就来分析一下  Vue 3 中是如何处理这两种情况的。

## 嵌套处理

> 至于为什么需要处理副作用函数嵌套而不是禁止嵌套，是因为 **Vue 组件的渲染函数本身也是一个 `Effect`，当组件嵌套时自然就会发生 `Effect` 嵌套**。

根据 **Vue.js 设计与实现** 一书中对 `Effect` 的定义：**副作用函数指的是会产生副作用的函数**，但是在 Vue 中这个指的应该是：**在依赖改变时会引发执行的函数**。

联系上文 `track` 收集依赖时，会 **将当前的 `Effect` 函数设置为 `activeEffect` 并根据 `Effect` 函数执行过程中关联的数据对象和具体数据项将自身（也就是 `activeEffect`）插入到全局的依赖管理中心 `targetMap` 中**，当数据变化时遍历该数据对应的副作用函数集合进行执行。

但是当时没有具体解析它的添加过程，只是提了一下会将当前 `Effect` 插入到 `targetMap` 中，假设收集过程是这样的：

```js
// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数赋值给 activeEffect
    activeEffect = effectFn
    fn()
  }
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  effectFn()
}
```

> 节选自 《Vue.js 设计与实现》

此时内层副作用函数的执行会覆盖 `activeEffect` 的值，并且永远不会恢复到原来的值，导致后续依赖收集时插入的副作用函数都是新函数并且无法正常回到上一个副作用函数。

例如：

```js
// 原始数据
const data = { foo: true, bar: true }
// 代理对象
const obj = new Proxy(data, { /* ... */ })
// 全局变量
let temp1, temp2
// effectFn1 嵌套了 effectFn2
effect(function effectFn1() {
  console.log('effectFn1 执行')
  effect(function effectFn2() {
    console.log('effectFn2 执行')
    // 在 effectFn2 中读取 obj.bar 属性
    temp2 = obj.bar
  })
  // 在 effectFn1 中读取 obj.foo 属性
  temp1 = obj.foo
})
```

最终将会打印：

```
'effectFn1 执行'
'effectFn2 执行'
'effectFn2 执行'
```

> 因为在执行内部的 `effectFn2` 时，`activeEffect` 为 `effectFn2`，即使在其执行结束之后依然没有恢复到 `effectFn1`，导致 `obj.foo` 改变时对应的副作用函数依然是 `effectFn2`



所以 Vue 采用了一个 **副作用函数栈 `effectStack`** 来解决嵌套问题（后续版本改为了  **类似链表的形式，通过给当前副作用函数增加一个 `parent` 属性来保留原副作用函数，用 `effectTrackDepth` 变量来存储当前链长度**）。

在遇到 `effect` 副作用时，首先将其插入到栈中，并将 `activeEffect` 始终指向栈顶元素；在 `effect` 执行结束之后将该函数弹出 `effectStack`，重新将栈顶元素设置为 `activeEffect`（在后续版本中，即是通过将 `activeEffect` 重新设置为其 `parent` 属性绑定的副作用函数）。

> 个人认为：后续改为 类链表模式，也可以减少每次弹出时去查找数组长度，增加代码性能。

## 循环处理

这里的循环处理指的是 **开发者可能会在 `Effect` 函数中再次修改数据，如果不做限制处理，将造成 `Effect` 函数循环调用，形成死循环**。

例如：

```js
// 原始数据
const data = { total： 0 }
// 代理对象
const obj = new Proxy(data, { /* ... */ })

effect(function effectFn() {
	obj.total ++
})
```

此时因为在 `effectFn`  中再次触发了依赖对象 `obj.total` 的更新，将会通过 `trigger` 操作再次派发更新执行 `effectFn`，导致死循环，提示 `Uncaught RangeError: Maximum call stack size exceeded` 内存溢出。

为了阻止这种情况，Vue 在 `trigger` 操作的过程中，在 `triggerEffect` 执行副作用函数时增加了一个判断：`if (effect !== activeEffect || effect.allowRecurse)`，即 **只有在预执行的副作用函数不等于当前 `activeEffect` 或者 该副作用函数允许递归调用的情况下，才会执行该副作用函数**。

源码如下：

```js
function triggerEffect(effect: ReactiveEffect) {
  if (effect !== activeEffect || effect.allowRecurse) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
```

此时，我们在改造一下上面的代码进行打印的话，就能在 `Effect` 执行一次之后结束。

```js
// 原始数据
const data = { total： 0 }
// 代理对象
const obj = new Proxy(data, { /* ... */ })

effect(function effectFn() {
  console.log(obj.total)
	obj.total ++
})

obj.total ++
console.log(obj.total)
```

最终会打印：

```
0
2
3
```

> 打印如下结果的原因是：
>
> 1. 在收集依赖时需要执行 `effectFn`，此时会打印当前值 0，并执行 `obj.total++`，此时 `obj.total` 值为 1，并且因为循环调用被终止的问题，此次事件循环结束
> 2. 然后外部的 `obj.total++` 更改了它的值为 2 并且触发了值的更新操作，会再次执行 `effectFn`，此时打印值为 2，并继续执行 `obj.total ++`，但是这次更新依然被终止触发副作用
> 3. 最终执行外部的打印操作，值最终为 3

## 小节

Vue 3 在调整了依赖收集策略之后，对副作用的限制处理也做了很多优化，其中核心的就有 **嵌套处理和循环处理**，以及副作用函数的 **调度执行**。

其中，对 `Effect` 嵌套副作用的处理主要是通过 **类链表的形式保存副作用的嵌套关系，确保当前激活副作用 `activeEffect` 的正确赋值与恢复，从而完成依赖的正确收集**。

而对 `Effect` 函数中修改依赖数据造成循环调用的情况，则是 **通过特定配置项 `allowRecurse` 和执行函数对比的方式来终止（允许）副作用函数继续执行** 的。
