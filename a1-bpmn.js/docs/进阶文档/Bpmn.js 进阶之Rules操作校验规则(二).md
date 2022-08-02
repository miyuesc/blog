---
theme: nico
highlight: a11y-dark
---

携手创作，共同成长！这是我参与「掘金日新计划 · 8 月更文挑战」的第5天，[点击查看活动详情](https://juejin.cn/post/7123120819437322247 "https://juejin.cn/post/7123120819437322247")

## 前言

上一节 [Bpmn.js 进阶之Rules操作校验规则(一)](https://juejin.cn/post/7126184218375225375) 中大致讲解了 `bpmn.js` 内自带的一部分规则以及如何扩展原有的操作规则配置。但是，`bpmn.js` 的操作规则如何新增，内部怎么运作的我们还是不清楚，所以这一节我们简单讲讲这部分内容。

> 刚开始使用 `bpmn.js` 或者准备了解 `bpmn.js` 基本原理的可以查看该系列首篇文章 [Bpmn.js 进阶指南（万字长文）](https://juejin.cn/post/7117481147277246500)

-----

## 1. `CommandInterceptor` 与 `CommandStack`

上一章讲到，`diagram.js` 内部添加了一个规则模块 `Rules`，与继承操作命令拦截器 `CommandInterceptor` 的规则创建模块 `RuleProvider`。

`Rules` 内部依赖 `CommandStack` 操作命令栈，并提供了一个 `allowed` 判断方法。源码如下：

```javascript
export default function Rules(injector) {
  this._commandStack = injector.get('commandStack', false);
}
Rules.$inject = [ 'injector' ];

/**
 * 返回是否可以在指定的上下文中执行给定的建模操作。
 * 除非明确返回 false，否则都视为允许执行
 *
 * @param {string} action 需要检查的操作名称
 * @param {Object} [context] 该操作对应的上下文参数数据
 *
 * @return {boolean | null} null 表示忽略
 */
Rules.prototype.allowed = function(action, context) {
    var allowed = true;
    var commandStack = this._commandStack;
    if (commandStack) {
        allowed = commandStack.canExecute(action, context);
    }
    // 返回 undefined 也视为 true，表示没有配置判断规则，默认通过
    return allowed === undefined ? true : allowed;
};
```

这里可以明显的看出来，内部也是调用的 `CommandStack` 模块实例的 `canExecute` 方法。

`canExecute` 方法内部通过两种方式判断:

1. 通过全局事件总线 EventBus 判断，用户可以通过注册 `${command}.canExecute` 事件对应的监听函数，设置函数返回值为 false 来阻止对应操作
2. 通过给对应的命令/操作配置处理函数(即 `Handler`)来处理

```javascript
export default function CommandStack(eventBus, injector) {
    //...
}
CommandStack.$inject = [ 'eventBus', 'injector' ];

// ...
/**
 * 判断给定命令/操作是否可以执行
 * @param  {string} command
 * @param  {Object} context
 *
 * @return {boolean | null}
 */
CommandStack.prototype.canExecute = function(command, context) {
    var action = { command: command, context: context };
    var handler = this._getHandler(command);
    var result = this._fire(command, 'canExecute', action);
    if (result === undefined) {
        if (!handler) {
            return false;
        }
        if (handler.canExecute) {
            result = handler.canExecute(context);
        }
    }
    return result;
};
```

> 这里注意有一个优先级问题，只有在用户没有设置 `${command}.canExecute` 监听函数时，或者该函数没有显示返回值时才会调用 `Handler.canExecute`

与 `CommandStack` 关联的 `Handlers` 有两种类型：`CommandInterceptor` 和 `CommandHandler`，后者只是一个定了的 执行、预执行和校验的抽象构造函数，基本没有使用；但是 `CommandInterceptor` 则是定义的 `canExecute | preExecute | preExecuted | execute | executed | postExecute | postExecuted | revert | reverted` 九种不同事件执行状态的处理函数（原型链上定义的方法），并且通过注册对应的 `EventBus` 监听函数来实现操作拦截的。

```javascript
export default function CommandInterceptor(eventBus) {
  this._eventBus = eventBus;
}
CommandInterceptor.$inject = [ 'eventBus' ];

CommandInterceptor.prototype.on = function(events, hook, priority, handlerFn, unwrap, that) {
    if (!isFunction(handlerFn)) {
        throw new Error('handlerFn must be a function');
    }
    if (!isArray(events)) {
        events = [ events ];
    }
    const eventBus = this._eventBus;
    events.forEach(event, function(event) {
        const fullEvent = [ 'commandStack', event, hook ].filter(function(e) { return e; }).join('.');
        eventBus.on(fullEvent, priority, unwrap ? unwrapEvent(handlerFn, that) : handlerFn, that);
    })
}
const hooks = [
    'canExecute',
    'preExecute',
    'preExecuted',
    'execute',
    'executed',
    'postExecute',
    'postExecuted',
    'revert',
    'reverted'
];
hooks.forEach(hook, function(hook) {
    CommandInterceptor.prototype[hook] = function(events, priority, handlerFn, unwrap, that) {
        if (isFunction(events) || isNumber(events)) {
            that = unwrap;
            unwrap = handlerFn;
            handlerFn = priority;
            priority = events;
            events = null;
        }
        this.on(events, hook, priority, handlerFn, unwrap, that);
    };
})
```

## 2. `RuleProvider`

`RuleProvider` 作为规则的基本构造方法，也可以视为一个半抽象函数，即只提供了基础的注册方法，但是规则内容与注册操作需要开发者自己显示。

```javascript
export default function RuleProvider(eventBus) {
  CommandInterceptor.call(this, eventBus);
  this.init();
}
RuleProvider.$inject = [ 'eventBus' ];
inherits(RuleProvider, CommandInterceptor);

// 基础规则注册方法
RuleProvider.prototype.addRule = function(actions, priority, fn) {
  const self = this;
  if (typeof actions === 'string') {
    actions = [ actions ];
  }
  actions.forEach(function(action) {
    self.canExecute(action, priority, function(context, action, event) {
      return fn(context);
    }, true);
  });
};

// 抽象初始化方法
RuleProvider.prototype.init = function() {};
```

可以看到这里的注册方法其实就是继承 `CommandInterceptor` 实现了 `action.canExecute` 方法。最终都是在 `EventBus` 上注册一个事件 `commandStack.${action}.canExecute` 对应的监听函数。

## 3. `BpmnRules`

`BpmnRules` 作为 `bpmn.js` 的核心操作规则模块，默认定义了九个操作校验规则，具体见 [Bpmn.js 进阶之Rules操作校验规则(一) -- 默认规则](https://juejin.cn/post/7126184218375225375#heading-2)。

并且在注册这些默认规则之外，提供了 `canCopy`, `canMove`, `canReplace` 等 13 个校验方法，分别校验连线的连接校验、元素的创建移动修改类型校验、元素复制以及插入校验等。

## 4. 总结

根据这两节的 `Rules` 操作校验规则的讲解，可以看到 `bpmn.js` 内部的各个模块都是基本独立的，都通过 `EventBus` 模块来连接各个模块，通过 `Provider` 来扩展基础模块，即使有模块间依赖，也是通过依赖注入的形式去避免对依赖模块代码的直接操作。

如果默认的规则配置不满足需求，也可以通过配置 `commandStack.${action}.canExecute` 这样的规则来直接进行处理。不过这里需要注意的是，建议设置事件监听回调函数的 `priority`