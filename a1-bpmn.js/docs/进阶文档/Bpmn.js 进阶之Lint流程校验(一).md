---
theme: smartblue
highlight: a11y-dark
---

携手创作，共同成长！这是我参与「掘金日新计划 · 8 月更文挑战」的第8天，[点击查看活动详情](https://juejin.cn/post/7123120819437322247 "https://juejin.cn/post/7123120819437322247")

## 前言

在之前的文章中已经把 **bpmn.js** 的执行原理和模块扩展方式都做了一些简单介绍，对 **Renderer** 和 **Rules** 等常用功能也进行了说明。这个时候基本上已经可以满足大部分情况下的需求场景，但是也有小伙伴反应产品有新需求，需要在前端对流程完整性进行校验。

所以这小节主要讲解如何使用 **bpmnlint** 对流程进行校验。

-----

## 1. 介绍

**bpmn.js** 的流程校验通过 **bpmnlint** 模块提供基础的校验规则与 **bpmn-js-bpmnlint** 模块来完成错误标识和动态校验。

### 1.1 bpmnlint 流程校验模块

该模块作为基础模块，主要包含以下几个部分：

1. **lib**：核心目录，包括以下几个构造函数：
   1. 提供一个规则校验执行者 **Linter** ，通过规则测试函数 **testRule** 和错误报告生成器 **Reporter** 来进行校验并输出校验结果；
   2. 提供分别基于流程节点/静态文件的两个规则配置解析器
   3. 一个支持模块：支持通过一个 config 对象来生成一个包含 **{config, resolver}** 的 JavaScript 文件
2. **bin**：用来主动读取根目录下的 **.bpmnlintrc** 配置文件，通过 **bpmnlint xxx.bpmn** 来校验对应的 **xxx.bpmn** 文件并输出校验结果
3. **rules**：内部预设规则，目前已包含 17 条规则和一个类型检验规则创建器

### 1.2 Preset Rules 预设规则

| 规则文件名 | 规则描述 |
| ---- | ---- |
| **conditional-flows.js** | 检查从条件分叉网关或任务节点传出的序列流是否为默认流或具有附加条件 |
| **end-event-required.js** | 检查每个流程范围内是否存在结束事件 |
| **event-sub-process-typed-start-event.js** | 检查每个子流程中是否具有开始事件 |
| **fake-join.js** | 检查事件或者任务节点是否具有隐式的流转规则，默认事件和任务只能有一个流入条件 |
| **label-required.js** | 检查元素必须包含 label 标签 |
| **no-bpmndi.js** | 检查可见的元素是否都具有对应的 DI 标签 |
| **no-complex-gateway.js** | 不能包含复杂网关 |
| **no-disconnected.js** | 检查是否有没有连接到流程中的元素，即不包含流入与流出的连线 |
| **no-duplicate-sequence-flows.js** | 检查是否有重复的流转路线 |
| **no-gateway-join-fork.js** | 检查网关是否同时有多个流入和流出规则 |
| **no-implicit-split.js** | 检查网关或者任务节点是否有多个流出路径且没有配置条件 |
| **no-inclusive-gateway.js** | 不能包含相容网关 |
| **single-blank-start-event.js** | 检查一个正常流程内是否有多个开始事件 |
| **single-event-definition.js** | 验证事件是否包含有超过一个事件定义的规则 |
| **start-event-required.js** | 检查一个流程内是否存在开始事件 |
| **sub-process-blank-start-event.js** | 检查子流程的开始事件是否具有启动条件 |
| **superfluous-gateway.js** | 检查网关是否同时只有一个流入和流出路径，这样的网关是多余的需要移除 |

## 2. 最小改动方式使用

这里有两种方式可以做到简单引入，可以参照 [基于Bpmn-js的流程设计器校验实现 -- 易样](https://juejin.cn/post/6844904180755202055)，这里简单进行说明。

### 2.1 使用 .bpmnlintrc 配置文件

1. 首先需要下载相关依赖

> **bpmnlint** 和 **bpmn-js-bpmnlint** 不管哪种方式都需要安装。

```shell
npm install bpmnlint bpmn-js-bpmnlint bpmnlint-loader --save
```

这里的 **bpmnlint-loader** 主要用来加载和解析 **.bpmnlintrc** 文件。

2. 创建 **.bpmnlintrc** 文件并配置规则

```json
{
  // 继承默认规则
  "extends": "bpmnlint:recommended",
  "rules": {
    // 配置自定义规则，也可以在这里关闭默认规则
    "label-required": "off"
  }
}
```

3. 修改 **webpack** 配置加载 **.bpmnlintrc** 文件

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.bpmnlintrc$/,
        use: [{ loader: 'bpmnlint-loader' }]
      }
    ]
  }
};
```

4. 继承 **bpmnlint** 模块

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';
import lintModule from 'bpmn-js-bpmnlint';
import bpmnlintConfig from './.bpmnlintrc';

const modeler = new BpmnModeler({
  linting: {
    active: true, // 默认开启规则校验
    bpmnlint: bpmnlintConfig // 引入规则配置
  },
  additionalModules: [
    lintModule // 引入规则校验模块
  ]
});
```

> **lintModule** 模块主要用于配置 **linting.toggle**, **linting.configChanged**, **elements.changed** 等事件的监听函数，在流程或规则发生改变、或者校验开启与关闭的时候进行重新校验，并将校验信息输出到界面上

### 2.2 bpmnlint-pack-config 生成配置文件

这里主要是通过 **bpmnlint-pack-config** 这个依赖包，将原来的 **.bpmnlintrc** 文件编译成 **JavaScript** 文件，避免 **webpack** 无法解析。

1. 首先，在上面安装的依赖包的基础上安装以下依赖

```shell
npm i -g bpmnlint-pack-config bpmnlint
```

> 这里需要安装到全局，保证可以正常执行命令

2. 执行编译命令，将配置文件转成 JavaScript 文件

```shell
npx bpmnlint-pack-config -c .bpmnlintrc -o packed-config.js -t es
```

3. 集成 bpmnlint 模块（这里因为已经改成了 js 文件，所以不需要再修改 webpack 配置）

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';
import lintModule from 'bpmn-js-bpmnlint';
import * as bpmnlintConfig from './packed-config';

const modeler = new BpmnModeler({
  linting: {
    bpmnlint: bpmnlintConfig
  },
  additionalModules: [
    lintModule
  ]
});
```

## 3. 动态启用/禁用校验

这里 **bpmn-js-bpmnlint** 提供的 **lintModule** 构造函数原型上定义了状态切换方法 **toggle**，所以只需要简单调用即可。

```javascript
const lintModule = modeler.get('linting')

lintModule && lintModule.toggle()
```

