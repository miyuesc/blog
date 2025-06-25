# JavaScript设计模式系列（五）：源码中的设计模式 - 解读Vue/React/Redux

> 优秀的框架不是偶然诞生的，它们都是设计模式的集大成者。今天我们深入Vue、React、Redux的源码，看看这些明星框架是如何运用设计模式解决复杂工程问题的。

## 前言：框架设计的智慧

当我们在使用Vue、React这些框架时，是否想过为什么它们能如此优雅地解决复杂的前端问题？为什么Redux能用如此简洁的API管理复杂的应用状态？

答案就在设计模式中。这些框架的作者都是设计模式的高手，他们巧妙地运用各种模式，让框架具备了：

- **高度的可扩展性**：新功能的添加不会破坏现有架构
- **优秀的可维护性**：代码结构清晰，职责分明
- **卓越的性能表现**：通过模式优化减少不必要的计算
- **良好的开发体验**：API设计符合直觉，易于理解和使用

今天我们将深入三大经典框架的源码，解析其中的设计模式精髓：

1. **Vue的响应式系统**：观察者模式 + 代理模式 + 依赖注入的完美融合
2. **React的Fiber架构**：链表 + 迭代器模式 + 任务调度的异步渲染
3. **Redux的状态管理**：单例模式 + 策略模式 + 观察者模式的综合应用

## 一、Vue响应式系统：观察者模式的艺术

### 1.1 Vue 2.x：Object.defineProperty的观察者实现

Vue 2的响应式系统是观察者模式的经典实现。让我们看看它是如何工作的：

```javascript
// Vue 2.x 响应式系统核心实现
class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep(); // 依赖收集器
    
    if (Array.isArray(value)) {
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }
  
  // 遍历对象的每个属性，转换为响应式
  walk(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  }
  
  observeArray(items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  }
}

// 依赖收集器 - 观察者模式的Subject
class Dep {
  constructor() {
    this.id = uid++;
    this.subs = []; // 订阅者列表
  }
  
  // 添加订阅者
  addSub(sub) {
    this.subs.push(sub);
  }
  
  // 移除订阅者
  removeSub(sub) {
    remove(this.subs, sub);
  }
  
  // 依赖收集
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
  
  // 通知所有订阅者更新
  notify() {
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}

// Watcher - 观察者模式的Observer
class Watcher {
  constructor(vm, expOrFn, cb, options) {
    this.vm = vm;
    this.cb = cb;
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    
    // 解析表达式
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
    }
    
    this.value = this.get();
  }
  
  // 获取值，触发依赖收集
  get() {
    pushTarget(this); // 设置当前Watcher为依赖收集目标
    let value;
    const vm = this.vm;
    
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
      throw e;
    } finally {
      popTarget(); // 恢复之前的依赖收集目标
      this.cleanupDeps();
    }
    
    return value;
  }
  
  // 添加依赖
  addDep(dep) {
    const id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }
  
  // 更新回调
  update() {
    if (this.lazy) {
      this.dirty = true;
    } else if (this.sync) {
      this.run();
    } else {
      queueWatcher(this); // 异步更新队列
    }
  }
  
  run() {
    if (this.active) {
      const value = this.get();
      if (value !== this.value || isObject(value) || this.deep) {
        const oldValue = this.value;
        this.value = value;
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
}

// 定义响应式属性
function defineReactive(obj, key, val, customSetter, shallow) {
  const dep = new Dep(); // 每个属性都有自己的依赖收集器
  
  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return;
  }
  
  const getter = property && property.get;
  const setter = property && property.set;
  
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }
  
  let childOb = !shallow && observe(val);
  
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val;
      
      // 依赖收集
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      
      return value;
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val;
      
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return;
      }
      
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      
      childOb = !shallow && observe(newVal);
      
      // 通知更新
      dep.notify();
    }
  });
}
```

**设计模式分析：**

1. **观察者模式**：`Dep`作为Subject，`Watcher`作为Observer，实现了数据变化的自动通知
2. **发布-订阅模式**：通过`dep.notify()`发布变化，`watcher.update()`订阅变化
3. **代理模式**：`Object.defineProperty`代理了属性的访问，在getter/setter中插入响应式逻辑

### 1.2 Vue 3.x：Proxy的代理模式革命

Vue 3使用Proxy重写了响应式系统，这是代理模式的完美体现：

```javascript
// Vue 3.x 响应式系统核心实现
const targetMap = new WeakMap(); // 全局依赖映射
let activeEffect = null; // 当前活跃的effect
const effectStack = []; // effect调用栈

// 创建响应式对象 - 代理模式
function reactive(target) {
  if (typeof target !== 'object' || target === null) {
    return target;
  }
  
  return new Proxy(target, {
    get(target, key, receiver) {
      // 依赖收集
      track(target, 'get', key);
      
      const result = Reflect.get(target, key, receiver);
      
      // 深度响应式
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }
      
      return result;
    },
    
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      
      // 触发更新
      if (oldValue !== value) {
        trigger(target, 'set', key, value, oldValue);
      }
      
      return result;
    },
    
    deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const oldValue = target[key];
      const result = Reflect.deleteProperty(target, key);
      
      if (result && hadKey) {
        trigger(target, 'delete', key, undefined, oldValue);
      }
      
      return result;
    },
    
    has(target, key) {
      const result = Reflect.has(target, key);
      track(target, 'has', key);
      return result;
    },
    
    ownKeys(target) {
      track(target, 'iterate', ITERATE_KEY);
      return Reflect.ownKeys(target);
    }
  });
}

// 依赖收集
function track(target, type, key) {
  if (!activeEffect) {
    return;
  }
  
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

// 触发更新
function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  
  const effects = new Set();
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || effect.allowRecurse) {
          effects.add(effect);
        }
      });
    }
  };
  
  // 收集需要触发的effects
  if (key !== void 0) {
    add(depsMap.get(key));
  }
  
  // 数组长度变化
  if (type === 'add' || type === 'delete') {
    add(depsMap.get(Array.isArray(target) ? 'length' : ITERATE_KEY));
  }
  
  // 执行effects
  const run = (effect) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };
  
  effects.forEach(run);
}

// Effect函数 - 观察者模式的Observer
function effect(fn, options = {}) {
  const effect = createReactiveEffect(fn, options);
  
  if (!options.lazy) {
    effect();
  }
  
  return effect;
}

function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effect.active) {
      return options.scheduler ? undefined : fn();
    }
    
    if (!effectStack.includes(effect)) {
      cleanup(effect);
      
      try {
        enableTracking();
        effectStack.push(effect);
        activeEffect = effect;
        return fn();
      } finally {
        effectStack.pop();
        resetTracking();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  
  effect.id = uid++;
  effect.allowRecurse = !!options.allowRecurse;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  
  return effect;
}

// 计算属性 - 装饰器模式
function computed(getterOrOptions) {
  let getter, setter;
  
  if (typeof getterOrOptions === 'function') {
    getter = getterOrOptions;
    setter = () => {
      console.warn('Write operation failed: computed value is readonly');
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  
  return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
  constructor(getter, setter) {
    this._setter = setter;
    this._dirty = true;
    this._value = undefined;
    
    // 创建effect，但不立即执行
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          trigger(toRaw(this), 'set', 'value');
        }
      }
    });
  }
  
  get value() {
    // 依赖收集
    track(toRaw(this), 'get', 'value');
    
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
    }
    
    return this._value;
  }
  
  set value(newValue) {
    this._setter(newValue);
  }
}
```

**设计模式分析：**

1. **代理模式**：Proxy完全代理了对象的访问，提供了比Object.defineProperty更强大的拦截能力
2. **观察者模式**：effect作为观察者，响应式对象作为被观察者
3. **装饰器模式**：computed为getter函数添加了缓存和依赖收集的功能
4. **策略模式**：不同的scheduler策略处理不同的更新场景

### 1.3 依赖注入模式：provide/inject

Vue的provide/inject是依赖注入模式的典型应用：

```javascript
// Vue 3 依赖注入实现
const currentInstance = null;

function provide(key, value) {
  if (!currentInstance) {
    console.warn('provide() can only be used inside setup()');
    return;
  }
  
  let provides = currentInstance.provides;
  const parentProvides = currentInstance.parent && currentInstance.parent.provides;
  
  // 如果当前实例的provides与父级相同，说明还没有自己的provides
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  
  provides[key] = value;
}

function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance;
  
  if (instance) {
    const provides = instance.parent == null
      ? instance.vnode.appContext && instance.vnode.appContext.provides
      : instance.parent.provides;
    
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && typeof defaultValue === 'function'
        ? defaultValue.call(instance.proxy)
        : defaultValue;
    } else {
      console.warn(`injection "${String(key)}" not found.`);
    }
  }
}

// 使用示例
// 祖先组件
const GrandParent = {
  setup() {
    // 提供依赖
    provide('theme', 'dark');
    provide('user', { name: 'John', role: 'admin' });
    
    return () => h(Parent);
  }
};

// 后代组件
const Child = {
  setup() {
    // 注入依赖
    const theme = inject('theme', 'light'); // 默认值为'light'
    const user = inject('user');
    
    return () => h('div', {
      class: `theme-${theme}`,
      textContent: `Hello, ${user.name}!`
    });
  }
};
```

**设计模式分析：**

1. **依赖注入模式**：子组件不需要知道依赖的具体来源，只需要声明需要什么
2. **原型链模式**：通过原型链实现依赖的层级查找
3. **默认值模式**：提供合理的默认值，增强系统的健壮性

## 二、React Fiber：链表与迭代器的异步渲染

### 2.1 Fiber架构：链表数据结构的巧妙运用

React Fiber是React 16引入的新架构，它使用链表数据结构重构了虚拟DOM树，实现了可中断的渲染：

```javascript
// Fiber节点结构
class FiberNode {
  constructor(tag, pendingProps, key, mode) {
    // 实例属性
    this.tag = tag; // 组件类型
    this.key = key;
    this.elementType = null;
    this.type = null;
    this.stateNode = null; // 对应的DOM节点或组件实例
    
    // Fiber链表结构
    this.return = null; // 父Fiber
    this.child = null; // 第一个子Fiber
    this.sibling = null; // 下一个兄弟Fiber
    this.index = 0;
    
    this.ref = null;
    
    // 工作相关
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;
    this.dependencies = null;
    
    this.mode = mode;
    
    // Effects
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
    this.deletions = null;
    
    // 调度相关
    this.lanes = NoLanes;
    this.childLanes = NoLanes;
    
    // 双缓冲
    this.alternate = null;
  }
}

// Fiber遍历算法 - 深度优先遍历
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent() {
  // 可中断的工作循环
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  
  let next;
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
  }
  
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  
  if (next === null) {
    // 如果没有子节点，完成当前工作单元
    completeUnitOfWork(unitOfWork);
  } else {
    // 继续处理子节点
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    
    // 完成当前节点的工作
    if ((completedWork.flags & Incomplete) === NoFlags) {
      let next;
      if (!enableProfilerTimer || (completedWork.mode & ProfileMode) === NoMode) {
        next = completeWork(current, completedWork, subtreeRenderLanes);
      } else {
        startProfilerTimer(completedWork);
        next = completeWork(current, completedWork, subtreeRenderLanes);
        stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
      }
      
      if (next !== null) {
        workInProgress = next;
        return;
      }
    }
    
    // 寻找下一个工作单元
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // 处理兄弟节点
      workInProgress = siblingFiber;
      return;
    }
    
    // 回到父节点
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
  
  // 已经回到根节点，工作完成
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
}
```

### 2.2 时间切片与调度器：迭代器模式的应用

React的调度器使用了迭代器模式来实现时间切片：

```javascript
// 调度器核心实现
class Scheduler {
  constructor() {
    this.taskQueue = []; // 任务队列
    this.timerQueue = []; // 延时任务队列
    this.isHostCallbackScheduled = false;
    this.isPerformingWork = false;
    this.currentTime = 0;
  }
  
  // 调度任务
  scheduleCallback(priorityLevel, callback, options) {
    const currentTime = getCurrentTime();
    
    let startTime;
    if (typeof options === 'object' && options !== null) {
      const delay = options.delay;
      if (typeof delay === 'number' && delay > 0) {
        startTime = currentTime + delay;
      } else {
        startTime = currentTime;
      }
    } else {
      startTime = currentTime;
    }
    
    let timeout;
    switch (priorityLevel) {
      case ImmediatePriority:
        timeout = IMMEDIATE_PRIORITY_TIMEOUT; // -1
        break;
      case UserBlockingPriority:
        timeout = USER_BLOCKING_PRIORITY_TIMEOUT; // 250ms
        break;
      case IdlePriority:
        timeout = IDLE_PRIORITY_TIMEOUT; // 1073741823ms
        break;
      case LowPriority:
        timeout = LOW_PRIORITY_TIMEOUT; // 10000ms
        break;
      case NormalPriority:
      default:
        timeout = NORMAL_PRIORITY_TIMEOUT; // 5000ms
        break;
    }
    
    const expirationTime = startTime + timeout;
    
    const newTask = {
      id: taskIdCounter++,
      callback,
      priorityLevel,
      startTime,
      expirationTime,
      sortIndex: -1,
    };
    
    if (startTime > currentTime) {
      // 延时任务
      newTask.sortIndex = startTime;
      push(timerQueue, newTask);
      
      if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
        if (isHostTimeoutScheduled) {
          cancelHostTimeout();
        } else {
          isHostTimeoutScheduled = true;
        }
        requestHostTimeout(handleTimeout, startTime - currentTime);
      }
    } else {
      // 立即执行的任务
      newTask.sortIndex = expirationTime;
      push(taskQueue, newTask);
      
      if (!isHostCallbackScheduled && !isPerformingWork) {
        isHostCallbackScheduled = true;
        requestHostCallback(flushWork);
      }
    }
    
    return newTask;
  }
  
  // 工作循环 - 迭代器模式
  workLoop(hasTimeRemaining, initialTime) {
    let currentTime = initialTime;
    advanceTimers(currentTime);
    currentTask = peek(taskQueue);
    
    while (currentTask !== null && !enableSchedulerDebugging) {
      if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
        // 当前任务还没过期，但时间片用完了，需要让出控制权
        break;
      }
      
      const callback = currentTask.callback;
      if (typeof callback === 'function') {
        currentTask.callback = null;
        currentPriorityLevel = currentTask.priorityLevel;
        const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
        
        const continuationCallback = callback(didUserCallbackTimeout);
        currentTime = getCurrentTime();
        
        if (typeof continuationCallback === 'function') {
          // 任务返回了继续函数，说明任务还没完成
          currentTask.callback = continuationCallback;
        } else {
          // 任务完成，从队列中移除
          if (currentTask === peek(taskQueue)) {
            pop(taskQueue);
          }
        }
        
        advanceTimers(currentTime);
      } else {
        pop(taskQueue);
      }
      
      currentTask = peek(taskQueue);
    }
    
    // 返回是否还有更多工作
    if (currentTask !== null) {
      return true;
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
      return false;
    }
  }
}

// 时间切片实现
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // 主线程只被阻塞了一小段时间，比一帧的时间少
    // 不要让出控制权，继续工作
    return false;
  }
  
  // 主线程被阻塞了相当长的时间
  // 我们可能想要让出控制权，这样浏览器就可以执行高优先级的任务
  // 比如绘制和用户输入
  if (enableIsInputPending) {
    if (isInputPending !== null) {
      return isInputPending();
    }
  }
  
  return true;
}
```

### 2.3 Hooks：状态管理的函数式设计

React Hooks是函数式编程和状态管理的巧妙结合：

```javascript
// Hooks实现原理
let currentlyRenderingFiber = null;
let currentHook = null;
let workInProgressHook = null;

// useState实现
function useState(initialState) {
  return useReducer(
    basicStateReducer,
    initialState
  );
}

function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

function useReducer(reducer, initialArg, init) {
  const currentHook = mountWorkInProgressHook();
  
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg;
  }
  
  currentHook.memoizedState = currentHook.baseState = initialState;
  
  const queue = (currentHook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState,
  });
  
  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ));
  
  return [currentHook.memoizedState, dispatch];
}

// useEffect实现
function useEffect(create, deps) {
  return useEffectImpl(
    UpdateEffect | PassiveEffect,
    HookPassive,
    create,
    deps,
  );
}

function useEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  currentlyRenderingFiber.flags |= fiberFlags;
  
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps,
  );
}

function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };
  
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  
  return effect;
}

// useMemo实现 - 装饰器模式
function useMemo(create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = create();
  
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

// useCallback实现
function useCallback(callback, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

// 自定义Hook示例 - 组合模式
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);
  
  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);
  
  return {
    count,
    increment,
    decrement,
    reset
  };
}

// 使用示例
function Counter() {
  const { count, increment, decrement, reset } = useCounter(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

**设计模式分析：**

1. **链表模式**：Fiber使用链表结构，支持可中断的遍历
2. **迭代器模式**：调度器的工作循环可以暂停和恢复
3. **时间切片模式**：将大任务分解为小任务，避免阻塞主线程
4. **装饰器模式**：useMemo和useCallback为函数添加缓存功能
5. **组合模式**：自定义Hooks通过组合基础Hooks实现复杂逻辑

## 三、Redux：函数式状态管理的设计模式

### 3.1 Store：单例模式的状态容器

Redux的Store是单例模式的经典应用：

```javascript
// Redux Store实现
function createStore(reducer, preloadedState, enhancer) {
  // 参数处理
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }
  
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }
    
    return enhancer(createStore)(reducer, preloadedState);
  }
  
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }
  
  let currentReducer = reducer;
  let currentState = preloadedState;
  let currentListeners = [];
  let nextListeners = currentListeners;
  let isDispatching = false;
  
  // 确保可以安全地修改监听器列表
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  
  // 获取当前状态
  function getState() {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
        'The reducer has already received the state as an argument. ' +
        'Pass it down from the top reducer instead of reading it from the store.'
      );
    }
    
    return currentState;
  }
  
  // 订阅状态变化 - 观察者模式
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.');
    }
    
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
        'If you would like to be notified after the store has been updated, subscribe from a ' +
        'component and invoke store.getState() in the callback to access the latest state. ' +
        'See https://redux.js.org/api-reference/store#subscribelistener for more details.'
      );
    }
    
    let isSubscribed = true;
    
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    
    // 返回取消订阅函数
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
          'See https://redux.js.org/api-reference/store#subscribelistener for more details.'
        );
      }
      
      isSubscribed = false;
      
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }
  
  // 派发动作 - 命令模式
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
        'Use custom middleware for async actions.'
      );
    }
    
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
        'Have you misspelled a constant?'
      );
    }
    
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }
    
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    
    // 通知所有监听器
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
    
    return action;
  }
  
  // 替换reducer
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }
    
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.REPLACE });
  }
  
  // 初始化状态
  dispatch({ type: ActionTypes.INIT });
  
  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  };
}
```

### 3.2 Reducer：策略模式的状态更新

Reducer是策略模式的完美体现，不同的action对应不同的状态更新策略：

```javascript
// Reducer组合 - 组合模式
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};
  
  // 过滤有效的reducer
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }
  
  const finalReducerKeys = Object.keys(finalReducers);
  
  return function combination(state = {}, action) {
    let hasChanged = false;
    const nextState = {};
    
    // 遍历所有reducer
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      
      if (typeof nextStateForKey === 'undefined') {
        throw new Error(
          `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state.`
        );
      }
      
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

// 具体的Reducer实现 - 策略模式
const todoReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: action.id,
          text: action.text,
          completed: false,
          createdAt: new Date().toISOString()
        }
      ];
      
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
      
    case 'REMOVE_TODO':
      return state.filter(todo => todo.id !== action.id);
      
    case 'EDIT_TODO':
      return state.map(todo =>
        todo.id === action.id
          ? { ...todo, text: action.text, updatedAt: new Date().toISOString() }
          : todo
      );
      
    case 'CLEAR_COMPLETED':
      return state.filter(todo => !todo.completed);
      
    default:
      return state;
  }
};

const filterReducer = (state = 'SHOW_ALL', action) => {
  switch (action.type) {
    case 'SET_FILTER':
      return action.filter;
    default:
      return state;
  }
};

// 组合reducer
const rootReducer = combineReducers({
  todos: todoReducer,
  filter: filterReducer
});
```

### 3.3 Middleware：装饰器模式的中间件系统

Redux的中间件系统是装饰器模式的经典应用：

```javascript
// applyMiddleware实现
function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args);
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
        'Other middleware would not be applied to this dispatch.'
      );
    };
    
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    };
    
    // 应用所有中间件
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);
    
    return {
      ...store,
      dispatch
    };
  };
}

// 函数组合工具
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  
  if (funcs.length === 1) {
    return funcs[0];
  }
  
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// Logger中间件
const logger = store => next => action => {
  console.group(action.type);
  console.info('dispatching', action);
  
  const result = next(action);
  
  console.log('next state', store.getState());
  console.groupEnd();
  
  return result;
};

// Thunk中间件 - 支持异步action
const thunk = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState);
  }
  
  return next(action);
};

// Promise中间件
const promiseMiddleware = store => next => action => {
  if (action.payload && typeof action.payload.then === 'function') {
    // 处理Promise
    action.payload
      .then(result => {
        store.dispatch({ ...action, payload: result });
      })
      .catch(error => {
        store.dispatch({ ...action, payload: error, error: true });
      });
    
    return;
  }
  
  return next(action);
};

// 错误处理中间件
const crashReporter = store => next => action => {
  try {
    return next(action);
  } catch (err) {
    console.error('Caught an exception!', err);
    
    // 发送错误报告
    Raven.captureException(err, {
      extra: {
        action,
        state: store.getState()
      }
    });
    
    throw err;
  }
};

// 使用中间件
const store = createStore(
  rootReducer,
  applyMiddleware(
    thunk,
    logger,
    promiseMiddleware,
    crashReporter
  )
);
```

### 3.4 Redux Toolkit：现代化的状态管理

Redux Toolkit是Redux的现代化封装，使用了多种设计模式：

```javascript
// createSlice - 工厂模式 + 建造者模式
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步thunk
const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/todos`);
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 创建slice
const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {
    // 同步reducers
    addTodo: {
      reducer: (state, action) => {
        state.items.push(action.payload);
      },
      prepare: (text) => ({
        payload: {
          id: nanoid(),
          text,
          completed: false,
          createdAt: new Date().toISOString()
        }
      })
    },
    
    toggleTodo: (state, action) => {
      const todo = state.items.find(todo => todo.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    
    removeTodo: (state, action) => {
      state.items = state.items.filter(todo => todo.id !== action.payload);
    }
  },
  
  // 异步reducers
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// 导出actions和reducer
export const { addTodo, toggleTodo, removeTodo } = todosSlice.actions;
export default todosSlice.reducer;

// Selectors - 选择器模式
export const selectAllTodos = (state) => state.todos.items;
export const selectTodoById = (state, todoId) => 
  state.todos.items.find(todo => todo.id === todoId);
export const selectCompletedTodos = (state) => 
  state.todos.items.filter(todo => todo.completed);
export const selectActiveTodos = (state) => 
  state.todos.items.filter(todo => !todo.completed);

// 使用createSelector进行记忆化
import { createSelector } from '@reduxjs/toolkit';

export const selectTodoStats = createSelector(
  [selectAllTodos],
  (todos) => ({
    total: todos.length,
    completed: todos.filter(todo => todo.completed).length,
    active: todos.filter(todo => !todo.completed).length
  })
);
```

**设计模式分析：**

1. **单例模式**：Store确保全局状态的唯一性
2. **观察者模式**：subscribe/dispatch实现状态变化的通知机制
3. **策略模式**：不同的reducer处理不同的action类型
4. **装饰器模式**：middleware为dispatch添加额外功能
5. **组合模式**：combineReducers组合多个reducer
6. **命令模式**：action作为命令对象，封装状态变更操作
7. **工厂模式**：createSlice工厂函数创建reducer和actions
8. **选择器模式**：selector函数提供状态查询接口

## 四、设计模式在框架中的价值

### 4.1 可扩展性：开放封闭原则的体现

这些框架都遵循开放封闭原则：对扩展开放，对修改封闭。

**Vue的插件系统：**
```javascript
// Vue插件系统 - 策略模式
const MyPlugin = {
  install(Vue, options) {
    // 添加全局方法
    Vue.myGlobalMethod = function () {
      // 逻辑...
    };
    
    // 添加全局资源
    Vue.directive('my-directive', {
      bind (el, binding, vnode, oldVnode) {
        // 逻辑...
      }
    });
    
    // 注入组件选项
    Vue.mixin({
      created: function () {
        // 逻辑...
      }
    });
    
    // 添加实例方法
    Vue.prototype.$myMethod = function (methodOptions) {
      // 逻辑...
    };
  }
};

// 使用插件
Vue.use(MyPlugin, { someOption: true });
```

**React的高阶组件：**
```javascript
// HOC - 装饰器模式
function withLoading(WrappedComponent) {
  return function WithLoadingComponent(props) {
    if (props.isLoading) {
      return <div>Loading...</div>;
    }
    
    return <WrappedComponent {...props} />;
  };
}

// 使用HOC
const EnhancedComponent = withLoading(MyComponent);
```

### 4.2 可维护性：职责分离的设计

**Vue的组件系统：**
- Template负责视图结构
- Script负责逻辑处理
- Style负责样式定义

**React的组件化：**
- 组件负责UI渲染
- Hooks负责状态逻辑
- Context负责数据传递

**Redux的分层架构：**
- Action负责描述变化
- Reducer负责状态更新
- Store负责状态管理
- Middleware负责副作用处理

### 4.3 性能优化：模式驱动的优化策略

**Vue的响应式优化：**
```javascript
// Vue 3的响应式优化
// 1. Proxy的懒代理
function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      // 只有在访问时才创建子对象的代理
      const result = Reflect.get(target, key);
      if (isObject(result)) {
        return reactive(result);
      }
      return result;
    }
  });
}

// 2. 编译时优化
// 静态提升
const _hoisted_1 = { class: "static" };
function render() {
  return h('div', _hoisted_1, /* 动态内容 */);
}
```

**React的性能优化：**
```javascript
// React的优化策略
// 1. memo - 装饰器模式
const OptimizedComponent = React.memo(function MyComponent(props) {
  return <div>{props.name}</div>;
}, (prevProps, nextProps) => {
  return prevProps.name === nextProps.name;
});

// 2. useMemo和useCallback - 缓存模式
function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);
  
  const handleClick = useCallback((id) => {
    // 处理点击
  }, []);
  
  return (
    <div>
      {filteredItems.map(item => 
        <Item key={item.id} item={item} onClick={handleClick} />
      )}
    </div>
  );
}
```

## 五、总结：设计模式的现代应用

### 5.1 模式的演进

从这些框架的源码分析中，我们可以看到设计模式在现代前端开发中的演进：

1. **从类到函数**：React Hooks展示了函数式编程如何优雅地处理状态
2. **从继承到组合**：现代框架更倾向于组合而非继承
3. **从同步到异步**：Fiber架构展示了如何用设计模式解决异步渲染问题
4. **从命令式到声明式**：响应式系统让开发者专注于"是什么"而非"怎么做"

### 5.2 学习启示

1. **理解问题本质**：设计模式不是银弹，要先理解要解决的问题
2. **适度使用**：不要为了使用模式而使用模式
3. **关注演进**：随着技术发展，模式的实现方式也在演进
4. **实践验证**：通过阅读优秀框架源码来学习模式的实际应用

### 5.3 实践建议

1. **从简单开始**：先掌握基础模式，再学习复杂的组合应用
2. **多写多练**：通过实际项目来应用和验证设计模式
3. **持续重构**：随着需求变化，适时重构代码结构
4. **团队协作**：在团队中推广设计模式，提升整体代码质量

## 结语

设计模式是软件工程的智慧结晶，而Vue、React、Redux这些优秀框架则是设计模式在现代前端开发中的最佳实践。通过深入理解这些框架的设计思想，我们不仅能更好地使用它们，更能在自己的项目中应用这些模式，写出更优雅、更可维护的代码。

记住，**好的代码不是写出来的，而是重构出来的**。设计模式为我们提供了重构的方向和目标，让我们的代码从"能用"走向"好用"，从"码农"成长为"架构师"。

---

*本文是《JavaScript设计模式：从"码农"到"架构师"》系列的第五篇，也是最后一篇。希望通过这个系列，能帮助大家建立起完整的设计模式知识体系，在前端开发的道路上走得更远。*

*如果你觉得这个系列对你有帮助，欢迎分享给更多的前端开发者。让我们一起在技术的道路上不断进步，用设计模式的智慧构建更美好的数字世界。*

## 参考资料

1. [Vue.js 官方文档](https://vuejs.org/)
2. [React 官方文档](https://reactjs.org/)
3. [Redux 官方文档](https://redux.js.org/)
4. [Vue.js 源码解析](https://github.com/vuejs/vue)
5. [React 源码解析](https://github.com/facebook/react)
6. [Redux 源码解析](https://github.com/reduxjs/redux)
7. 《设计模式：可复用面向对象软件的基础》- GoF
8. 《JavaScript设计模式与开发实践》- 曾探
9. 《深入理解ES6》- Nicholas C. Zakas
10. 《你不知道的JavaScript》系列 - Kyle Simpson

---

**系列文章导航：**

1. [创建型模式：花式创建对象](./1-创建型模式-花式创建对象.md)
2. [结构型模式：优雅组合的艺术](./2-结构型模式-优雅组合的艺术.md)
3. [行为型模式：对象间的优雅协作](./3-行为型模式-对象间的优雅协作.md)
4. [架构模式：构建可扩展的应用](./4-架构模式-构建可扩展的应用.md)
5. [源码中的设计模式：解读Vue/React/Redux](./5-源码中的设计模式-解读Vue-React-Redux.md) ← 当前文章

**关于作者：**

资深前端架构师，拥有20年+一线开发经验，专注于前端工程化、性能优化和架构设计。曾主导多个百万级用户量Web应用的架构设计，对React/Vue生态有深入研究。

**技术专长：**
- 前端架构设计与性能优化
- JavaScript深度应用与源码解析
- 微前端架构与工程化实践
- 设计模式在前端领域的应用

**联系方式：**
- 技术博客：[个人技术博客]
- GitHub：[GitHub主页]
- 掘金：[掘金主页]
- 微信公众号：[公众号名称]

---

*感谢阅读！如果本文对你有帮助，请不要忘记点赞、收藏和分享。你的支持是我持续创作的动力！*