# Vue 3 diff 算法图解

## 前言

大家好，我是 Miyue，人称“小米”（不是那个小米）~

从上一篇 [从 CreateApp 开始学习 Vue 源码](https://juejin.cn/post/7213211041764261948) 中，基本了解了 `createApp()` 与 `app.mount()` 两个方法的来源和大致执行过程，这里依然以上文的流程图来进行回顾：

![createApp 过程回顾](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6452e5cfaafb4fe1ba29f15425683d64~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp?)

所以在创建好应用 app 后执行 `mount` 函数，通过 `createVNode` 将我们的入口组件 `App.vue` 转换成 `VNode` 树，最后使用 `patch()` 函数将 `VNode` 树转换为真实 Dom 渲染到页面上。

而 Vue 3 的 diff 算法，与 Vue 2 一样，依然在 `patch` 过程中。

那么首先，先来看一下 VNode 的生成吧~

## createVNode - 生成虚拟节点

`createVNode`，即创建一个 `VNode` 虚拟节点对象。

它最多接收 5 个参数（当然在 `createApp` 的时候只有一个 `App.vue`），其中 `type` 可以是一个字符串，也可以是一个 `class` 组件或者普通组件，甚至可以是一个 `VNode` 对象。

所以首先会对 `type` 进行处理，在没有传入 `type` 或者指定为 `v-ndc` 时，会自动转成 **注释节点** 类型，然后判断是否已经是一个 `VNode` 对象；如果是的话，则返回对传入 `VNode` 的拷贝对象（除了部分属性之外，其他属性都是浅层拷贝）。

如果不是一个 `VNode` 的话，则进入后续循环（`App.vue` 就不是）。

之后的过程会先处理组件的 `class` 和 `style` 绑定格式，然后处理传入 `type` 参数对应的 `VNode` 对象类型，最后通过 `createBaseVNode()` 创建 `VNode` 返回。 

![image-20230324170019456](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230324170019456.png)

然后，`mount` 函数内部会通过 `render` 函数进行 `VNode` 到真实 `dom` 的解析和渲染。

而 `render` 函数内部则是根据是否有新的 `VNode` 对象来确认是 **挂载/更新** 还是 **卸载 dom 节点** —— 如果有新的 `VNode` 对象，则调用 `patch` 进行 `VNode` 的解析与渲染；否则调用 `unmount` 进行卸载。

## patch 函数 - VNode 节点的类型处理

在 Vue 项目的开发过程中，我们都知道 **组件与 HTML 元素都是通过标签在模板中使用的**，并且除了元素与组件之外，可能还有注释节点等内容。所以在解析的时候也需要 **根据不同的节点类型进行分类处理**。

所以 `patch` 函数的主要功能就是 **根据 `VNode` 对象的不同类型调用对应的处理方法，如果有绑定 `ref` 属性，则还会将组件**







