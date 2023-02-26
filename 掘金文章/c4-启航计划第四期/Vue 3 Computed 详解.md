# Vue 3 Computed 详解

我正在参加「掘金·启航计划」

## 前言

在上一节  [Vue2与Vue3响应式原理与依赖收集详解](https://juejin.cn/post/7202454684657107005) 一文中，我们大致讲解了 Vue 3 与 Vue 2 实现响应式系统的区别，以及 Vue 3 响应式系统中 `reactive` 的实现原理。

在常规开发中，`ref、reactive` 定义数据时，一般也会与 `computed` 配合作为模板的数据提供者，而与前两者不同的是，`computed` 不仅支持数据获取的 `getter`，也支持数据更新 `setter`，并且内部是通过 `ReactiveEffect` 副作用来实现的数据依赖收集与结果更新的。但是，`computed` 的数据是会 **缓存** 的。
