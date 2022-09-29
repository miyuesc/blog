# BpmnEventBus - 带权重的事件总线设计（二）

## 前言

上一节已经大致描述了一个传统的简单事件总线模块的设计，以及 bpmn.js 中的事件总线 **EventBus** 所新增的功能，以及他的订阅者的存储方式。那么这一节我们就从源码层面来理解整个事件总线模块的实现方式。

## 1. 实例方法

bpmn.js 的 **EventBus** 模块，默认提供订阅注册（**on**, **once**）、订阅取消（**off**）、事件/消息发布（**fire**）、错误处理（**handleError**），以及标准事件/消息体创建方法（**createEvent**）。

其中订阅注册方法 on 和 once，都接收4个参数：events 事件名（可复数）、priority 权重、callback 回调函数、that 上下文。

其中 events 和 callback 肯定是必传参数，用来注册某个事件类型的订阅，以及需要执行的函数；权重不传则默认是 1000.

另外还有一系列的私有方法，例如订阅函数的执行方法 `_invokeListener` 和 `_invokeListeners`，销毁方法 `_destroy` 等。

## 2. 订阅注册

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

## 3. 订阅取消

BpmnEventBus 的订阅取消逻辑，本质上与一般的事件总线模块的订阅取消是一样的，只是将数组处理改成了链表的处理。

代码如下：

```javascript
EventBus.prototype.off = function(events, callback) {
  events = isArray(events) ? events : [ events ];
  var self = this;
  
  events.forEach(function(event) {
    self._removeListener(event, callback);
  });

};

EventBus.prototype._removeListener = function(event, callback) {
  var listener = this._getListeners(event),
      nextListener,
      previousListener,
      listenerCallback;

  if (!callback) {
    this._setListeners(event, null);
    return;
  }

  while (listener) {
    nextListener = listener.next;
    listenerCallback = listener.callback;

    if (listenerCallback === callback || listenerCallback[FN_REF] === callback) {
      if (previousListener) {
        previousListener.next = nextListener;
      } else {
        this._setListeners(event, nextListener);
      }
    }

    previousListener = listener;
    listener = nextListener;
  }
};
```

由上面的代码可以发现，Bpmn.js 的 EventBus 模块提供的 off 订阅取消方法其实和其他形式设计的事件总线取消订阅方法完全一致；只是在 **清除特定的订阅者** 时，才有一点点差别。

数组形式保存的订阅者是遍历数组，找出 callback 一致的方法再删除；而这里这是循环查找订阅者链表的下一个节点，匹配则直接将该节点的 **next** 订阅作为该节点上一节点的 **next**。

当然，没有指定特定订阅者时，就会取消该事件/消息类型的所有订阅。

## 4. 消息触发

一般的消息触发订阅者回调时，所有的订阅者回调函数的执行逻辑和返回值都是互不影响的；但是 Bpmn.js 的 EventBus 则不一样。

具体哪里不一样，我们通过源码来分析一下：

```javascript
EventBus.prototype.fire = function(type, data) {
  var event,
      firstListener,
      returnValue,
      args;

  args = slice.call(arguments);

  if (typeof type === 'object') {
    data = type;
    type = data.type;
  }

  if (!type) {
    throw new Error('no event type specified');
  }

  firstListener = this._listeners[type];

  if (!firstListener) return;

  if (data instanceof InternalEvent) {
    event = data;
  } else {
    event = this.createEvent(data);
  }

  args[0] = event;

  var originalType = event.type;

  if (type !== originalType) {
    event.type = type;
  }

  try {
    returnValue = this._invokeListeners(event, args, firstListener);
  } finally {
    if (type !== originalType) {
      event.type = originalType;
    }
  }

  if (returnValue === undefined && event.defaultPrevented) {
    returnValue = false;
  }

  return returnValue;
};

EventBus.prototype._invokeListeners = function(event, args, listener) {
  var returnValue;
  while (listener) {
    if (event.cancelBubble) {
      break;
    }
    returnValue = this._invokeListener(event, args, listener);
    listener = listener.next;
  }
  return returnValue;
};

EventBus.prototype._invokeListener = function(event, args, listener) {
  var returnValue;
  if (listener.callback.__isTomb) {
    return returnValue;
  }
  try {
    returnValue = invokeFunction(listener.callback, args);
    
    if (returnValue !== undefined) {
      event.returnValue = returnValue;
      event.stopPropagation();
    }
    
    if (returnValue === false) {
      event.preventDefault();
    }
  } catch (error) {
    if (!this.handleError(error)) {
      console.error('unhandled error in event listener', error);
      throw error;
    }
  }

  return returnValue;
};

EventBus.prototype.handleError = function(error) {
  return this.fire('error', { error: error }) === false;
};

function invokeFunction(fn, args) {
  return fn.apply(null, args);
}
```

> 这里有一些简单方法，像 **handleError, invokeFunction** 这样的方法，逻辑都比较简单，就省略这些步骤了。

这里的消息触发都是通过 **fire** 方法开始订阅者回调执行的，所以就直接从该方法开始。

### 4.1 fire

fire 方法内部虽然代码不是很多，但是已经包括了完整的触发过程。

1. 首先是参数校验，处理回调函数的参数格式。这里可以将订阅/事件类型放在一个对象中作为 data 的一部分，个人认为也是一个好的处理方式
2. 然后是查找订阅者链表的开头和回调参数的标准格式处理；此时如果没有订阅者的话就直接退出，与其他事件总线的设计方式一样
3. 之后则是将 click 这样的元素默认事件进行代理
4. 核心部分就是通过 `_invokeListeners` 依次按照订阅者链表的顺序进行执行，并保留返回值
5. 最后恢复默认事件类型，返回订阅者函数的返回值

> 这里的核心部分就在于私有方法 `_invokeListeners`，并且需要注意的是，该方法接收的 **event** 参数是一个 **InternalEvent** 对象，所以在后面的 `_invokeListeners` 和 `_invokeListener` 方法执行过程中，每次使用和修改的都是同一个事件对象。

### 4.2 _invokeListeners

这个部分的功能就比较简单了，就是遍历订阅者链表依次调用 `_invokeListener` 执行订阅者回调函数，并保留每次的返回值；最终输出最后一个订阅者函数的返回值。

但是这里增加了一个终止操作：

即当上一个订阅者函数将共享事件对象 **event**（就是上文所说的 InternalEvent 对象）中的属性 **cancelBubble** 设置为 true 时，会直接终止 **while** 循环，抛出 **上次（也就是将 cancelBubble 设置为 true 的订阅者函数）** 的结果。

### 4.3 _invokeListener

这个方法就是执行单独一个订阅者回调函数，通过 **function.apply(null, args)** 执行并记录相关返回值。

> 因为在注册时对订阅者回调函数进行了一次封装，如果传入了上下文参数 that，则会在注册时直接通过 function.bind() 绑定回调函数的上下文。
>
> 并且在函数开头会校验该订阅者的配置，如果是 **once** 注册的订阅者，在执行一次之后会把函数属性 **`__isTomb`** 设置为 true，此时会直接返回 undefined。

这里可以通过在订阅者回调函数中返回一个 false 来阻止默认事件；或者直接返回共享 event 对象保存的返回值，来停止订阅的后续执行。

## 5. 总结

总的来说，Bpmn.js 的 EventBus 事件总线模块，与传统事件总线模块在设计上的区别主要在于 **订阅者的存储方式** 上，通过链表的形式保证 **权重高、注册早** 的订阅者 **先执行**，通过 **共享 Event 对象** 来实现订阅者回调之间的数据共享和终止消息传播。
