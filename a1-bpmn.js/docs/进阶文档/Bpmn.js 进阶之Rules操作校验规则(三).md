---
theme: scrolls-light
highlight: a11y-dark
---

## 前言

在前两篇文章 [Bpmn.js 进阶指南之Rules操作校验规则(一)](https://juejin.cn/post/7126184218375225375) 和 [Bpmn.js 进阶指南之Rules操作校验规则(二)](https://juejin.cn/post/7126790247492354055) 中，已经完整的解析了 `bpmn.js` 中的默认操作规则，以及整个规则模块的运作流程。这篇文章主要讲如何使用操作规则来自定义规则、影响页面内容。

## 1. 自定义规则

以 **bpmn.js** 的 **AlignElements** 元素对齐模块为例，自定义规则的规则定义和注册部分其实比较简单。

```typescript
// 定义 规则初始化构造函数
export default function BpmnAlignElements(eventBus) {
  RuleProvider.call(this, eventBus);
}
// 注入 EventBus 事件总线依赖
BpmnAlignElements.$inject = [ 'eventBus' ];
// 继承 RuleProvider
inherits(BpmnAlignElements, RuleProvider);
// 实现 init 初始化方法，注册 elements.align 操作校验规则
BpmnAlignElements.prototype.init = function() {
    this.addRule('elements.align', function(context) {
        // 1. 获取上下文菜单中的元素实例数组
        var elements = context.elements;
        // 2. 筛选元素，排除 label、connection、root 类型的元素
        var filteredElements = filter(elements, function(element) {
            return !(element.waypoints || element.host || element.labelTarget);
        });
        // 3. 筛选出在同一父元素中的元素
        filteredElements = getParents(filteredElements);
        // 4. 判断符合条件的元素个数，如果小于2则不能进行对齐操作
        if (filteredElements.length < 2) {
            return false;
        }
        // 5. 符合条件，返回一个可以转为 true 的值
        return filteredElements;
    });
};
```

当然，这里也可以用 **class** 方式实现，个人也比较推荐 **class** 方式：

```typescript
export default class BpmnAlignElements extends RuleProvider {
    constructor(eventBus) {
        super(eventBus);
    }
    init() {
        this.addRule('elements.align', function (context) {
            // ...
        });
    }
}
```

之后，在导出为一个 **AdditionalModule** 格式的模块：

```typescript
// align-elements/index.ts
import BpmnAlignElements from './BpmnAlignElements';
export default {
    __init__: [bpmnAlignElements],
    bpmnAlignElements: ['type', BpmnAlignElements]
}
```

> 至此，自定义操作规则就结束了，在 **Modeler** 实例化完成之后，可以看到事件总线模块已经注册了一个 **commandStack.elements.align.canExecute** 事件。

## 2. 规则使用

使用已定义的规则，一般情况下有两种用途：
1. 在某个事件/操作发生时进行判断，组织非法操作。这种方式通常是没有办法明显的体现在页面上的
2. 根据规则，动态控制某个菜单的选项。这种方式一般用在 **Palette**，**ContextPad** 和 **PopupMenu** 上，通过对应的 **Provider** 来实现。

### 2.1 阻止操作

阻止某些操作的进行，一般不会让用户直接从页面上看到任何差异。

以 **Palette** 创建一个 **StartEvent** 节点为例，在点击节点图标开始拖拽的过程中，会同时触发 **darg.move** 和 **create.move** 两个事件，在这个期间，每次触发 **create.move** 都会在监听回调函数中判断元素是否可以创建。

核心逻辑如下：

```javascript
eventBus.on([ 'create.move', 'create.hover' ], function(event) {
  // 获取事件上下文数据，拿到需要创建的 elements 元素实例数组
  const context = event.context,
        elements = context.elements,
        hover = event.hover,
        source = context.source,
        hints = context.hints || {};
  // 如果不是 hover 状态，则直接返回，由 create.end 事件的监听回调来处理
  if (!hover) {
    context.canExecute = false;
    context.target = null;
    return;
  }
  // 计算当前位置
  const position = {
    x: event.x,
    y: event.y
  };
  // 判断是否可以正常执行创建操作
  const canExecute = context.canExecute = hover && canCreate(elements, hover, position, source, hints);
  // 如果是正处于 hover 状态，则根据是否可以在当前位置创建/挂载设置对应的画布样式等
  if (hover && canExecute !== null) {
    context.target = hover;
    if (canExecute && canExecute.attach) {
      setMarker(hover, MARKER_ATTACH);
    } else {
      setMarker(hover, canExecute ? MARKER_NEW_PARENT : MARKER_NOT_OK);
    }
  }
})
```

这里只处理了 **create.move** 事件过程中的判断，主要用来改变画布样式，提示用户当前是否可以正常操作得到预想的结果。

在用户抬起鼠标按键结束拖拽过程时，则是由 **create.end** 事件的回调函数来进行处理。

在 **Create** 模块的源码中，官方是通过分别设置两个回调来处理的，分别用于结束 **hover** 状态和正式执行创建操作。核心逻辑如下：

```javascript
// 1. 设置不同事件下的状态，结束 hover
eventBus.on([ 'create.end', 'create.out', 'create.cleanup' ], function(event) {
  const hover = event.hover;
  if (hover) {
    setMarker(hover, null);
  }
});
// 2. 正式执行创建操作
eventBus.on('create.end', function(event) {
  const context = event.context,
        source = context.source,
        shape = context.shape,
        elements = context.elements,
        target = context.target,
        canExecute = context.canExecute,
        attach = canExecute && canExecute.attach,
        connect = canExecute && canExecute.connect,
        hints = context.hints || {};
	// 如果是禁止创建或者没有目标元素的时候直接返回 false
  if (canExecute === false || !target) {
    return false;
  }
	// 设置创建位置
  const position = {
    x: event.x,
    y: event.y
  };
	// 创建元素并添加到画布上
  if (connect) {
    shape = modeling.appendShape(source, shape, position, target, {
      attach: attach,
      connection: connect === true ? {} : connect,
      connectionTarget: hints.connectionTarget
    });
  } else {
    elements = modeling.createElements(elements, position, target, {...hints, attach});
    shape = find(elements, (element) => !isConnection(element));
  }
  // 更新上下文
  assign(context, { elements, shape });
  assign(event, { elements, shape });
});
```

而其中核心的 **canCreate** 方法，除了校验是否有目标元素、是否是连线类元素之外，就是通过调用 **rules.allowed('shape.attach')**, **rules.allowed('shape.create')**, **rules.allowed('elements.create')** 等规则来进行判断的

> 综上，整个创建过程中主要是在 **create.move**（也就是拖拽过程中）阶段进行的操作规则校验，并将校验结果保存到事件总线的上下文数据中；而 **create.end** 则是单纯的根据上下文中的规则校验结果，判断是否执行元素创建。

> 🚀 如果需要扩展该创建规则，可以通过注册 **create.move** 事件的监听函数，并设置较高的优先级来保证优先执行，可以设置上下文数据对象中的 **hover** 为 **false** 直接结束创建过程。
>
> 也可以通过继承 **Create** 构造函数，扩展 **canCreate** 方法来实现规则的扩展。

### 2.2  改变菜单

> 规则模块不仅可以用来阻止操作，也可以用来改变原有的菜单项。

这个过程需要配合对应的菜单项构造器 **Provider** 来实现。

这里我们假设有这样一个需求：在开始节点被选中时不显示 **ContextPad** 上下文菜单选项，在结束节点上的上下文菜单中禁止显示删除按钮。

**因为这里需要把原有的 ContextPad 的一些选项禁用或者移除，所以只能是创建一个新的 ContextPadProvider 去覆盖官方原始构造器。但是为了减少代码量，可以直接继承官方构造器进行改造**

```typescript
// 配置禁止删除规则
class CustomDeleteRules extends RuleProvider {
  constructor(eventBus) {
    super(eventBus);
  }
  init() {
    this.addRule('elements.delete', function (context) {
      const elements = context.elements
      const endEvents = elements.filter(el => el.type === "bpmn:EndEvent")
      if(endEvents.length) {
        return false
      }
      return context
    });
  }
}

// 1. 继承原始构造器
class RewriteContextPadProvider extends ContextPadProvider {
  constructor(
   config: any,
   injector: Injector,
   eventBus: EventBus,
   contextPad: ContextPad,
   modeling: Modeling,
   elementFactory: ElementFactory,
   connect: Connect,
   create: Create,
   popupMenu: PopupMenu,
   canvas: Canvas,
   rules: Rules,
   translate: Translate
  ) {
    super(config, injector, eventBus, contextPad, modeling, elementFactory, connect, create, popupMenu, canvas, rules, translate)
    // 2. 保留原有的菜单项入口
    this._getContextPadEntries = super.getContextPadEntries
  }
  
  // 3. 实现自己的菜单项配置
  getContextPadEntries(element: Base) {
    // 3.1 开始节点没有菜单项
    if(element.type === 'bpmn:StartEvent') {
      return {}
    }
    // 3.2 其他节点保留原始菜单项
    const actions = this._getContextPadEntries(element)
    // 3.3 判断是否可以执行删除规则（this._rules 继承自 ContextPadProvider）
    baseAllowed = this._rules.allowed('elements.delete', {
      elements: [element]
    });
    if(baseAllowed) {
      delete actions.delete
    }
    // 3.4 返回菜单项
    return actions
  }
}
```

