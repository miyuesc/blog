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

当然，这里也可以用 **class** 方式实现，个人也比较推荐 **class** 方式。

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