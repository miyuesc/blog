---
theme: scrolls-light
highlight: a11y-dark
---

携手创作，共同成长！这是我参与「掘金日新计划 · 8 月更文挑战」的第9天，[点击查看活动详情](https://juejin.cn/post/7123120819437322247)

## 前言

在之前的文章中已经把 **bpmn.js** 的执行原理和模块扩展方式都做了一些简单介绍，对 **Renderer** 和 **Rules** 等常用功能也进行了说明。这个时候基本上已经可以满足大部分情况下的需求场景，但是也有小伙伴反应产品有新需求，需要在前端对流程完整性进行校验。

上一节已经简单介绍了 **bpmnlint** 的基本结构和使用方式，这一小节先介绍一下 **bpmn-js-bpmnlint** 这个 **根据规则配置与校验结果进行标记和错误提示** 模块

-----

## 1. 介绍

首先上一节我们已经介绍了如何使用 **bpmnlint** 来加载默认的流程校验规则，并对默认规则的功能进行了简单说明。但是，仅使用 **bpmnlint** 没有办法动态校验和进行错误信息提示， **bpmn-js-bpmnlint** 就是专门用来结合 **bpmn.js** 来校验 **bpmnlint** 配置规则的。

 **bpmn-js-bpmnlint** 内部包含两个 **additionalModule** 模块：**Linting** 和 **LintingEditorActions**。

### 1.1 Linting 核心校验模块

该模块依赖 **Modeler 实例，Canvas，ElementRegistry，EventBus，Overlays 和 Translate**，并通过实例化 **Modeler** 时传入的配置文件中的 **linting** 部分来获取规则配置和判断是否直接打开规则校验。

**linting** 配置包含两个属性：**active** 和 **bpmnlint**

1. **active**：实例化后直接开启校验
2. **bpmnlint**：包含 **Resolver** 解析器和 **config.rules** 规则配置的一个对象

> 这里我们以默认直接开启流程校验为例，大致解释一下整个从校验到显示错误信息的过程。下文的 **this** 指向的是 **Linting** 实例。

1. 初始化 **Linting** 实例：构造函数内部主要配置几个事件监听函数，并创建一个底部按钮

   1. **['import.done',  'elements.changed',  'linting.configChanged',  'linting.toggle']** ：判断当前 active 状态，调用 **this.update()** 执行重新校验和信息更新
   2. **linting.toggle**：更新规则校验模块的开启状态，如果关闭，则清空错误信息并重置底部的按钮
   3. **diagram.clear**：流程清空时清除错误信息
   4. **diagram.init**：仅执行一次，在流程图初始化之后加载规则配置（**config.bpmnlint**）
   5. 调用 **this._init()**，其实就是执行 **this._createButton(); this._updateButton()** 创建一个底部的按钮开关，并在开关上显示校验错误个数

2. 当添加了一个元素（或者修改）之后会触发 **elements.changed** 事件，这里会调用 **this.update()** 方法。
3. 在 **this.update()** 方法中，会调用 **this.lint()** 来进行校验，并在校验结束后根据校验信息，清除掉原始的错误信息图层，重新创建错误信息图层并更新底部按钮的显示内容。最后触发 **linting.completed** 事件结束校验过程。

### 1.2 LintingEditorActions 编辑操作

这个逻辑很简单，只是继承 **diagram.js/EditorActions** 来注册一个校验开关的操作。

## 2. lint 校验过程

在执行 **this.lint()** 的时候，内部会引用 **bpmnlint** 中的 **Linter** 模块，并根据 **new Modeler** 时传入的 **linting.bpmnlint** 配置初始化一个 **linter** 实例，之后则是获取流程图的根定义节点 **bpmn:definitions** 来执行 **linter.lint(definitions)** 流程校验。

 **linter.lint()** 接收两个参数：**moddleRoot** 和 **config** （bpmn-js-bpmnlint 只传了第一个参数），在执行过程中首先是通过 **linter.resolveRules** 来读取规则配置，如果调用该方法时没有传入 **config** 参数，则会直接根据 **linter** 实例化时传入的规则配置来生成一个完整的规则校验数组。

随后会遍历该数组，逐一校验当前流程是否符合设定规则，最后将完整的校验报告返回。

> 完整的 **Linter.lint** 过程在后面两节中讲解。





























