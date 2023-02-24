# Vue 3 Effect 任务调度详解

我正在参加「掘金·启航计划」

## 前言

结合前面两篇文章中的内容，我们分析了 Vue 3 响应式系统的 **基础实现部分**，包括 **操作拦截** 与 **依赖收集**，并且也分析了依赖收集过程中 `Effect` 副作用嵌套和循环调用两种情况下的处理方式。

但是在 Vue 的整个响应式系统中，**会同时存在很多 `Effect` 副作用，并且每个副作用函数与依赖对象之间可能都是多对多的关系**，所以，**在什么时候执行哪个副作用函数是非常重要的**，这就是 Vue 响应式系统的 **可调度性**。

## 什么是任务调度

在计算机硬件系统或者大型软件设计中，都有 **任务调度** 这个概念。最初，**调度** 这个概念指的是 **在计算机中分配工作所需资源的方法，包括处理器、显卡之类的硬件资源，也包含线程、进程这样的虚拟资源**。后来这个概念也在后端开发中得到了发展，比如分布式系统的任务调度，可以用来管理任务并发等。

而在 JavaScript 中，由于其 **单线程** 的特性，任务调度一般只用来控制函数的执行时机等，所以在 Vue 中也被叫做是 **调度执行**，`Effect` 需要达到的目标是 **可调度**。

根据 《Vue.js 设计与实现》 中的概念，**所谓可调度，指的是当 trigger 动作触发副作用函数重新执行时，有能力决定副作用函数执行的时机、次数以及方式**。即可以 **人为控制每个 `Effect` 副作用函数的具体执行时刻、执行次数以及执行方式**。

## Vue 可调度简介

因为在之前的 **嵌套和循环处理** 中对 `Effect` 函数内部进行了大量改造，所以如果任务调度也在其中来实现的话，无疑会加重内部的逻辑，造成不必要的bug，所以 Vue 为 `effect` 函数设计了一个新的选项参数 `options`，允许用户配置一个 `scheduler` 来自定义控制 `effect` 的执行。

```js
effect(
 () => {
   console.log(obj.foo)
 },
 // options
 {
   // 调度器 scheduler 是一个函数，接收当前的 effect 函数
   scheduler(effect) {
     // ...
   }
 }
)
```

> 当然，这个 `scheduler` 只是用来调度 `effect` 函数的执行，但是本身的生成依然由 Vue 内部处理，暴露给开发者的是相关的几个配置项。
>
> 包括：
>
> - `sync`：同步执行（直接顺序执行）
> - `post`：延迟到渲染结束后执行
> - `pre`：默认配置，组件渲染前执行（预执行）
>
> 大部分情况下（包括 `render`）都是预执行的，只有通过 `watchEffect` 配置 `flush` 或者直接使用 `watchPostEffect、watchSyncEffect` 时才会有相应的 `scheduler` 产生。



## 源码实现

整个 `scheduler` 的源码在 `core/packages/runtime-core/src/scheduler.ts` 中，主要包含 `queueJob、queuePostFlushCb、flushPreFlushCbs、flushPostFlushCbs` 几个核心方法，以及我们最常用的 `nexttick`。其中核心方法就是 `queueJob` 与 `queueFlush` 了，当然还有一个延迟执行的处理函数 `queuePostFlushCb`。

在 `scheduler` 模块中，主要是通过 **模块内变量（闭包）** 定义了几个变量：

- `isFlushing`：是否有任务正在执行
- `isFlushPending`：队列中是否还有任务正在等待执行
- `queue`：任务队列
- `flushIndex`：当前任务的索引
- `pendingPostFlushCbs`：延迟执行（`post`）的任务队列
- `activePostFlushCbs`：正在执行的回调函数数组
- `postFlushIndex`：当前延迟任务的索引
- `currentFlushPromise` 和 `resolvedPromise`：用来插入微任务队列的 `Promise`



在 [Vue2与Vue3响应式原理与依赖收集详解](https://juejin.cn/post/7202454684657107005) 中我们提到了 `reactive` 方法会改变对象的 `get/set` 相关方法，在 `get` 之类的数据获取过程中会进行执行 `track` 方法进行依赖收集，而 `render、watch、computed` 等都基于 **`effect`** 副作用来实现，组件实例首次初始化时就会执行一次对应的副作用函数进行依赖收集，然后更新数据才会进行视图更新。

而 `effect` 的核心就是 `ReactiveEffect` 构造函数，以上提到的每个过程/函数都会创建一个对应的 `ReactiveEffect` 实例，而这个构造函数除了会接收一个 `scheduler` 配置用来管理该副作用实例的执行时机，

省略掉其他与依赖相关的内容，单独查看这个构造函数与执行调度相关的代码，省略后如下：

```js
class {
  constructor(fn, scheduler = null) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.parent = void 0;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      if (this.deferStop) {
        this.stop();
      }
    }
  }
  stop() {
    if (activeEffect === this) {
      this.deferStop = true;
    } else if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
};
```

这部分代码的内容其实除了省略掉的 **管理副作用函数依赖的数据对象** 之外，就是为这个实例定义一个 `run` 副作用执行方法和 `stop` 清空依赖与







































