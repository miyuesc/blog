---
theme: nico
highlight: a11y-dark
---

携手创作，共同成长！这是我参与「掘金日新计划 · 8 月更文挑战」的第4天，[点击查看活动详情](https://juejin.cn/post/7123120819437322247 "https://juejin.cn/post/7123120819437322247")

## 前言

继上次的 [Bpmn.js 进阶指南（万字长文）](https://juejin.cn/post/7117481147277246500) 之后，我相信大家对 Bpmn.js 的使用和自定义方法都有了一定的了解。但是因为有小伙伴反应文章太长，导致大家看完需要很长时间，正好配合 8月的更文活动，以后都在每篇文章中单独讲解一到三个小内容。

-----

## 1. Bpmn.js 的操作流程

在上一节 [Renderer 详解](https://juejin.cn/post/7125705812068007943) 中我们讲到了如何改变一个元素的尺寸以及显示效果，大致描述了从 `Palette` 点击一个元素创建按钮到拖拽结束显示出完整的元素实例的过程；但是假设我们在创建的过程中需要添加一些判断条件来判断当前的创建或者修改操作不能进行呢？这一步该如何进行？后续开发者该怎么扩展呢？

为了解决这些问题，官方在底层库 `diagram.js` 中添加了一个规则模块 `Rules`，以及继承操作命令拦截器 `CommandInterceptor` 的规则创建模块 `RuleProvider`，我们可以通过继承 `RuleProvider` 来创建我们需要的规则，从而实现操作拦截。

> 至于 `CommandInterceptor` 与 `CommandStack` `CommandHandler` 之间的联系，我们后面单独讲😏

## 2. Bpmn.js 默认规则

上面我们说了可以通过 `RuleProvider` 来创建规则以达到拦截某些操作的功能，但是 `diagram.js` 默认是没有配置规则的。

只是，`bpmn.js` 为了结合 `BPMN 2.0` 业务流程规范，有一个单独的规则配置 `BpmnRules` 来保证用户的编辑操作符合 `BPMN 2.0` 规范。

这里大致描述一下这几个默认规则：

1. `connection.start`: 是否可以在该元素上启动连线操作，要求该元素不能是 `Label` 元素且元素类型继承关系上必须是 以下几种元素：
   1. 'bpmn:FlowNode': 基础流程节点元素
   2. 'bpmn:InteractionNode': 基础的可交互节点
   3. 'bpmn:DataObjectReference': 数据对象配置节点
   4. 'bpmn:DataStoreReference': 数据缓存配置节点
   5. 'bpmn:Group': 分组类型节点
   6. 'bpmn:TextAnnotation': 扩展文本注释节点
2. `connection.create`: 连线是否可以完整创建完成，需要校验连线起点与终点。规则首先校验禁止边界事件连线，之后再进行不同类型起点终点的具体规则（代码太长，不做细节描述了，，，）
3. `connection.reconnect`: 与 `connection.create` 的校验规则基本一致
4. `connection.updateWaypoints`: 判断能否更新连线的路径，默认全部通过
5. `shape.resize`: 判断元素的能否重设大小（一般是通过 DOM 节点拖拽触发），默认只有展开的 `SubProcess` 节点，以及 `Lane` 和 `Participant` 节点可以在不小于最小尺寸下进行 `resize`，而 `TextAnnotation` 和 `Group` 节点可以随意调整大小，其余类型节点均不可以调整。
6. `elements.create`: 元素创建判断，这个规则也很长，，，就不描述了，，，
7. `elements.move`: 元素移动操作，这里会通过四个条件判断，满足其一即可
   1. `canAttach`: 选中元素是否可以放置到目标元素中
   2. `canReplace`: 选中元素是否可以替换成目标配置中的元素类型
   3. `canMove`: 元素是否可以移动并且其中没有 `Lane` 节点
   4. `canInsert`: 选中元素是否可以插入到某个特定位置
8. `shape.create`: 形状创建规则，调用 `elements.create` 中的部分配置 `canCreate`
9. `shape.attach`: 形状挂载规则，调用 `canAttach` 的返回值

## 3. 扩展 Bpmn.js 原有规则

扩展原有规则的方法，大致分为以下几步：

```typescript
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider'

// 第一步，继承 RuleProvider 创建自己的规则构造函数，并执行 init
// 这里需要注意的是，我们需要多依赖一个模块 rules, 用来保留原有的规则配置
class CustomRules extends RuleProvider {
    _rules: Rules | undefined
    constructor(eventBus: EventBus, rules: Rules) {
        super(eventBus)
        this.init()
    }

    init() {
    //  第二步，注册自己的操作拦截规则，这里配置如果选择元素不能是开始节点或者结束节点，否则禁止删除
        this.addRule(['elements.delete'], 2000, function (context) {
            const [element]: Base = context.elements
            return element.type !== 'bpmn:StartEvent' && element.type !== 'bpmn:EndEvent'
        })
    }
}

// 这里增加对 rules 模块的依赖
CustomRules.$inject = ['eventBus', 'rules']

export default CustomRules

// 第三步，在 index.ts 中导出自定义规则模块，提供给 `Modeler` 实例化时使用
import CustomRules from './CustomRules'

export default {
    __init__: ['customRules'],
    customRules: ['type', CustomRules]
}
```

细心的同学可能会发现，`bpmn.js` 默认规则里面并没有 `elements.delete` 对应的预设规则，这里会不会出什么问题。

这个问题我们下一节在仔细讲解，这里可以告诉大家的是，`diagram.js` 的规则模块在元素删除时会判断 `elements.delete` 规则，并且只有在返回值是 `undefined` 的时候默认规则缺失，允许执行该次操作。
