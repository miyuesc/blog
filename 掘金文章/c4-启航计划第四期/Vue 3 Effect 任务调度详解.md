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

在 [Vue2与Vue3响应式原理与依赖收集详解](https://juejin.cn/post/7202454684657107005) 中我们提到了 `reactive` 方法会改变对象的 `get/set` 相关方法，在 `get` 之类的数据获取过程中会进行执行 `track` 方法进行依赖收集，而 `render、watch、computed` 等都基于 **`effect`** 副作用来实现，组件实例首次初始化时就会执行一次对应的副作用函数进行依赖收集，然后更新数据才会进行视图更新。

而 `effect` 的核心就是 `ReactiveEffect` 构造函数，以上提到的每个过程/函数都会创建一个对应的 `ReactiveEffect` 实例，而这个构造函数除了会接收一个 `scheduler` 配置用来管理该副作用实例的执行时机，

省略掉其他与依赖相关的内容，单独查看这个构造函数与执行调度相关的代码，省略后如下：

```js
class ReactiveEffect {
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

这部分代码的内容其实除了省略掉的 **管理副作用函数依赖的数据对象** 之外，就是为这个实例定义一个 `run` 副作用执行方法和 `stop` 清空依赖或者延迟执行，并且将 `scheduler` 配置挂载到实例上。



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



而 `ReactiveEffect` 在 Vue 中的实例化就只有 `watch、render、computed` 三类 API 的执行过程中，整个 `scheduler` 也就只有上面的三中情况：

- `pre` 渲染前执行（预执行），对应 `() => queueJob`
- `post` 渲染后执行（延迟执行），对应 `() => queuePostFlushCbs`
- `sync` 同步执行，对应 `() => effect.run()` 

> 当然 `computed` 的调度与这几类都不同，后面看 `computed` 的时候再说吧~

### 1.  `pre` 渲染前执行

不管是 Vue 2 还是 Vue 3，大部分情况下数据改变后派发更新，都会在渲染前执行所有相关的副作用（Watcher）函数，所以 Vue 3 的 `watchEffect` 默认的 `flush` 配置也是 `pre`。

所以这里以 `watchEffect` 的默认配置为例，在 `scheduler` 部分的处理如下：

```js
function watchEffect(effect2, options) {
  return doWatch(effect2, null, options);
}

function doWatch(source, cb, { immediate, deep, flush } = EMPTY_OBJ) {
  ...
  const job = () => effect.run();
  job.allowRecurse = false;
  job.pre = true;
  // pre 的情况，也就是 flush = pre
  if (instance) job.id = instance.uid;
  let scheduler = () => queueJob(job);
  const effect = new ReactiveEffect(getter, scheduler)
  
  effect.run() // 主要是收集依赖和设置初始值
  // 返回取消的方法
  return () => {
    effect.stop()
    if (instance && instance.scope) {
      remove(instance.scope.effects!, effect)
    }
  }
}
```

上面的代码省略掉了很大一部分参数处理相关的内容，与 `scheduler` 相关的核心部分就是 `let scheduler = () => queueJob(() => effect.run())`，然后通过 `ReactiveEffect` 将 `scheduler` 与 `effect` 关联起来；这里结合到之前的派发更新时的 `triggerEffect`，当有 `scheduler` 配置时就执行 `effect.scheduler()`，所以这里执行的其实是 `queueJob(() => effect.run())`。

```js
export function queueJob(job: SchedulerJob) {
  if (
    !queue.length ||
    !queue.includes(
      job,
      isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
    )
  ) {
    if (job.id == null) {
      queue.push(job)
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job)
    }
    queueFlush()
  }
}
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

`queueJob` 函数的核心就是将上面的 `job` 任务插入到 `queue` 任务队列中，然后通过 `queueFlush` 触发刷新队列的操作，最终当所有 `pre` 周期的任务都插入进去之后，会通过 `resolvedPromise.then(flushJobs)` 将所有 `job` 队列插入到当前的微任务队列中执行。

### 2. `sync` 同步执行

当设置为 `sync` 同步执行时，此时的 `scheduler` 就是一个箭头函数 `() => effect.run()`。即在 `triggerEffect` 时就会直接执行 `effect.run()`，而无需等待这次更新的宏任务执行结束后以微任务队列进行执行。

### 3. `post` 渲染后执行

当设置为 `post` 延迟执行时，此时的 `scheduler` 配置也是一个箭头函数用来插入到某个任务队列中，但是与 `pre` 不同的是，这种情况下使用的是 `() => queuePostRenderEffect(job, instance && instance.suspense)`。

```js
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
```

当我们排除掉异步依赖（即 `suspense` 的情况），最终是通过 `queuePostFlushCb` 将 `() => effect.run()` 这个任务插入到 `postQueue` 队列中。

```js
function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    if (!activePostFlushCbs || !activePostFlushCbs.includes(cb, cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex)) {
      pendingPostFlushCbs.push(cb);
    }
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueFlush();
}
```

与 `queueJob` 一样，最终都会调用 `queueFlush` 来刷新和处理任务队列。

## 核心方法 `flushJobs`

```js
function flushJobs(seen) {
  isFlushPending = false;
  isFlushing = true;
  queue.sort(comparator);
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && job.active !== false) {
        callWithErrorHandling(job, null, 14);
      }
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;
    flushPostFlushCbs(seen);
    isFlushing = false;
    currentFlushPromise = null;
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen);
    }
  }
}
function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)];
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }
    activePostFlushCbs = deduped;
    activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      activePostFlushCbs[postFlushIndex]();
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}
```

`flushJobs` 方法作为核心方法，主要进行以下工作：

1. 修改状态位，表示当前正在执行 `flushJobs`
2. 重新排列任务队列，这里主要是 **根据组件实例** 的顺序来确定执行顺序，父级默认优先于子级组件
3. 遍历任务队列，取出 `job`，并且判断这个任务还处于激活状态，则通过 `callWithErrorHandling` 执行该任务
4. 遍历结束后，重置状态和任务队列，调用 `flushPostFlushCbs` 执行 `post` 中的任务
5. 销毁 `promise`，判断任务列表是否又有新增任务

而 `flushPostFlushCbs` 则是对 `pendingPostFlushCbs` 数组进行去重和重新排序，然后遍历新数组并执行每个任务。



## 小节

> 因为笔者也是刚开始学习Vue3和相关源码，在副作用这部分的了解可能不是很清楚，导致文章的逻辑不是很清晰，内容也可能不是很准确，希望大家能多多包涵并指出我的错误。

总的来说，`effect` 通过一个配置项 `scheduler` 来实现了每个副作用函数的执行时刻，虽然按照源码的逻辑来看，Vue 内部默认只允许用户通过配置项 `flush` 的三个参数来确定每个 `effect` 的大致执行顺序，但是这种设计方式却是我们在实际项目中值得借鉴的。

我们可以通过 `flush` 的三个可用配置，来管理每个副作用函数的大致执行的优先级：

- `sync`：同步在数据更新过程中执行，默认情况下应该是三者中最先执行的
- `pre`：渲染前执行，一般来说会等待到所有的数据更新结束之后，在 `dom` 更新前按照组件实例和定义的顺序来执行每个副作用函数
- `post`：渲染后执行，一般是最后才会执行的，此时数据和 `dom` 都已经更新完毕























