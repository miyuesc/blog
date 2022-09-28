# BpmnEventBus - 带权重的事件总线设计（二）

## 前言

上一节已经大致描述了一个传统的简单事件总线模块的设计，以及 bpmn.js 中的事件总线 **EventBus** 所新增的功能，以及他的订阅者的存储方式。那么这一节我们就从源码层面来理解整个事件总线模块的实现方式。

## 1. 实例方法

bpmn.js 的 **EventBus** 模块，默认提供订阅注册（**on**, **once**）、订阅取消（**off**）、事件/消息发布（**fire**）、错误处理（**handleError**），以及标准事件/消息体创建方法（**createEvent**）。

其中订阅注册方法 on 和 once，都接收4个参数：events 事件名（可复数）、priority 权重、callback 回调函数、that 上下文。

其中 events 和 callback 肯定是必传参数，用来注册某个事件类型的订阅，以及需要执行的函数；权重不传则默认是 1000.

另外还有一系列的私有方法，例如订阅函数的执行方法 `_invokeListener` 和 `_invokeListeners`，销毁方法 `_destroy` 等。

## 2. 订阅注册方法

### 2.1 on 和 once

之前说过，订阅注册的两个方法 on 和 once 的区别主要在于，once 注册的订阅者在执行了一次之后就会取消订阅，但在之前的注册过程则基本一致。

```javascript
var FN_REF = '__fn';

var DEFAULT_PRIORITY = 1000;

var slice = Array.prototype.slice;

export default function EventBus() {
  this._listeners = {};
}

EventBus.prototype.on = function(events, priority, callback, that) {
  events = isArray(events) ? events : [ events ];

  if (isFunction(priority)) {
    that = callback;
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  var actualCallback = callback;

  if (that) {
    actualCallback = bind(callback, that);
    actualCallback[FN_REF] = callback[FN_REF] || callback;
  }

  var self = this;

  events.forEach(function(e) {
    self._addListener(e, {
      priority: priority,
      callback: actualCallback,
      next: null
    });
  });
};


EventBus.prototype.once = function(event, priority, callback, that) {
  var self = this;

  if (isFunction(priority)) {
    that = callback;
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  function wrappedCallback() {
    wrappedCallback.__isTomb = true;

    var result = callback.apply(that, arguments);

    self.off(event, wrappedCallback);

    return result;
  }
  
  wrappedCallback[FN_REF] = callback;

  this.on(event, priority, wrappedCallback);
};
```

> 在函数定义之前呢，首先是定义了一个标志位 **FN_REF** 和默认权重 **DEFAULT_PRIORITY**，并保留了 Array 函数的 **slice** 方法，用来将后面的类数组 arguments 对象转成正常数组形式。
>
> 并且在初始化时会增加一个内部属性 `_listeners`，用来保存不同类型事件的订阅链表

当然，这里我们假设在调用两个方法时都按照参数要求传递了 **全部参数**，并且 on 方法也只能一次注册一个类型的订阅。这时简化一下函数就是：

```javascript
EventBus.prototype.once = function(event, priority, callback, that) {
  var self = this;

  function wrappedCallback() {
    wrappedCallback.__isTomb = true;
    var result = callback.apply(that, arguments);
    self.off(event, wrappedCallback);
    return result;
  }
  
  wrappedCallback[FN_REF] = callback;

  this.on(event, priority, wrappedCallback);
};

EventBus.prototype.on = function(event, priority, callback, that) {
  var actualCallback = callback;

  if (that) {
    actualCallback = bind(callback, that);
    actualCallback[FN_REF] = callback[FN_REF] || callback;
  }

  this._addListener(event, { priority, callback: actualCallback, next: null });
};
```

此时我们可以发现，once 方法内部其实依然是调用的 on 来注册订阅，只是我们在内部修改了实际传入的回调函数 callback，修改后的回调函数 **wrappedCallback** 在执行时会添加一个函数属性 `__isTomb`，用来标识该订阅回调已经执行过，不能再次执行；最后通过 **off** 方法取消该订阅。

最终呢，订阅者的添加还是通过私有方法 `_addListener` 来注册的。

### 1.2 私有方法 addListener

该方法其实就一个作用，**递归查找** 该类型事件的链表，**直到找到权重值 priority 小于新注册事件权重值的事件**，将新订阅作为被找到订阅者的下一节点，然后更新该类型的事件链表并退出查找。

> 其实内部对获取类型的订阅者链表和更新方法都进行了拆分，这里为了方便就直接合并了。

```javascript
EventBus.prototype._addListener = function(event, newListener) {

  var listener = this._listeners[event],
      previousListener;

  if (!listener) {
    this._setListeners(event, newListener);
    return;
  }

  while (listener) {
    if (listener.priority < newListener.priority) {

      newListener.next = listener;

      if (previousListener) {
        previousListener.next = newListener;
      } else {
        this._listeners[event] = newListener;
      }
      return;
    }

    previousListener = listener;
    listener = listener.next;
  }

  previousListener.next = newListener;
};
```

举个栗子：

假设我们之前的订阅者链表按权重转成一个数组是：[ 1500, 1500, 1000, 1000 ]

此时我们新增两个订阅者，权重分别为 1300 和 1000，那么更新后的权重顺序数组则是：[ 1500, 1500, (new=1300), 1000, 1000, (new=1000) ]

## 3. 订阅取消方法

