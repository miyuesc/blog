# Vue 3 渲染过程与 diff 图解

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

## patch 函数 - VNode 节点的分类处理

在 Vue 项目的开发过程中，我们都知道 **组件与 HTML 元素都是通过标签在模板中使用的**，并且除了元素与组件之外，可能还有注释节点等内容。所以在解析的时候也需要 **根据不同的节点类型进行分类处理**。

所以 `patch` 函数的主要功能就是 **根据 `VNode` 对象的不同类型调用对应的处理方法，如果有绑定 `ref` 属性，则还会将绑定的 `ref` 元素（dom 节点或者组件实例）添加到当前的 Vue 实例上**。

整个 `patch` 过程包括以下几步：

1. 判断新旧 `VNode` 对象是否完全一致，一致时直接退出
2. 如果新旧 `VNode` 对象的 **类型不一致**，则 **卸载旧节点，将旧节点置为 `null` 进行后续逻辑**
3. 根据新节点的 `patchFlag` 配置是否需要优化
4. 根据新节点的 `type` 类型，调用不同的处理方法；这里大部分方法名都是以 `process` 开头，意为加工、处理对应元素
5. 如果设置了 `ref` 属性，则调用 `setRef` 处理对应绑定关系

过程图如下：

![image-20230327170534619](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230327170534619.png)

## processFunctions 节点实际处理过程

在 `patch` 过程中根据不同的 `VNode.type` 进行处理之后，分别会调用不同的函数来进行虚拟节点的实际处理与 dom 更新。其中有类似文本与注释这样的简单节点，也有具有多个子元素或者动态组件等这样的复杂标签，那么从易到难，先从简单的标签说起。

### processText 与 processCommentNode

```js
const processText = (oldVnode, newVnode, container, anchor) => {
  if(!oldVnode) {
    hostInsert(newVnode.el = hostCreateText(newVnode.children), container, anchor)
  } else {
    const el = (newVnode.el = newVnode.el!)
    if (newVnode.children !== oldVnode.children) {
      hostSetText(el, newVnode.children)
    }
  }
}
const processCommentNode = (oldVnode, newVnode, container, anchor) => {
  if(!oldVnode) {
    hostInsert(newVnode.el = hostCreateComment(newVnode.children), container, anchor)
  } else {
    newVnode.el = oldVnode.el
  }
}
```

纯文本节点很好理解，不存在旧内容时就在父级节点（`container`）中插入节点的文本内容，存在旧节点则首先比较值是否相等，不等就更新。

而注释节点与纯文本不同的是，在更新的时候会直接更新 `el` 属性。

### mountStaticNode 挂载静态节点

如果是 **开发环境**，内容更新时还会用 `patchStaticNode` 来进行更新，但是 **生产环境下只会在原节点被销毁之后才会进行挂载**，也就是在 Vue 3 中提到的 **静态提升**，用来进行性能优化。

非开发环境下，只有以下逻辑：

```js
case Static:
  if (oldVnode == null) {
    mountStaticNode(newVnode, container, anchor, isSVG)
  }

// ...

const mountStaticNode = (n2, container, anchor, isSVG) => {
  [n2.el, n2.anchor] = hostInsertStaticContent!(
    n2.children,
    container,
    anchor,
    isSVG,
    n2.el,
    n2.anchor
  )
}
```

即直接将这个节点的内容插入到父级元素的指定位置下。

> 根据官方给出的 demo，大部分 `template` 中的内容都会编译为 `StaticNode`，例如：
>
> ![image-20230327205649220](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230327205649220.png)

### processFragment 多节点处理

在 Vue 2 中，每个单文件组件下只能有一个根节点，而 Vue 3 中做了改进，我们可以在单个组件的模板中直接添加多个根节点标签（jsx 写法依然只能有一个根节点，因为需要符合 jsx 规范）。

在我们通过 `create-vite` 脚手架创建的项目中，`App.vue` 就是一个多根节点组件，此时就会进入到该函数逻辑中。

![image-20230327231249151](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230327231249151.png)

#### 1. 首次渲染

**多根节点在首次渲染时逻辑较为简单**，大致如下：

```js
const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG,
  slotScopeIds, optimized) => {
  const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
  const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
  let {
      patchFlag,
      dynamicChildren,
      slotScopeIds: fragmentSlotScopeIds
  } = n2;
  if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ?
          slotScopeIds.concat(fragmentSlotScopeIds) :
          fragmentSlotScopeIds;
  }
  if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense,
          isSVG, slotScopeIds, optimized);
  }
}
```

首次渲染与更新都有共同逻辑，即 **设置多根节点组件的开始与终止锚点，然后将组件的每个根节点按顺序向中间插入**。

因为 `App.vue` 中的内容方便解析，我们新增一个多根组件 `FragmentOne`，内容如下：

```html
<template>
  <div class="fragment-1">
    <h1>{{ name }} Page</h1>
  </div>
  <div class="fragment-2">
    <h1>Fragment Page</h1>
  </div>
  <div class="fragment-3">
    <h1>Fragment Page</h1>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue'
const name = ref<string | undefined>('FragmentOne')
</script>
```

当这个组件被解析到时，它会被编译成以下内容：

![image-20230327232159199](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230327232159199-1679930521427-1.png)

其中 `children` 数组中就是每一个根节点，然后在处理锚点时，因为是首次渲染，两个锚点会直接设置为两个空文本节点：

![image-20230327232404236](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230327232404236.png)

最后，会通过 `mountChildren` 方法遍历 `children` 数组，依次执行 `patch()` 处理每一个子元素。

#### 2. 派发更新

多根组件的更新相比首次挂载要 **复杂很多**，会根据 **所有根节点的稳定性** 来分开处理。

> 这里的稳定性指的是每个节点是否有 `key`，顺序是否不变等，一般情况下是 **非直接 `v-for` 创建的多根节点，顺序与个数都不会改变，但是每个节点内部可能会发生改变**，例如 `create-vite` 创建的项目中的 `App.vue`；当是稳定节点时，`patchFlag` 的值等于 64

大致代码如下：

```js
if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren) {
    patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG, slotScopeIds);
    if (parentComponent && parentComponent.type.__hmrId) {
        traverseStaticChildren(n1, n2);
    } else if (n2.key != null || (parentComponent && n2 === parentComponent.subTree)) {
        traverseStaticChildren(n1, n2, true);
    }
} else {
    patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
}
```

这里有两种情况：

1. 是稳定节点但是具有动态节点（`v-for`循环等），通过 `patchBlockChildren` 单独处理动态节点；然后通过 `traverseStaticChildren` 进行所有子节点的 `el` 属性处理
2. 不是稳定节点，则通过 `patchChildren` 来对比和更新每个子节点

> `patchChildren` 最终就会进入 Vue 3 的核心 `diff` 过程 —— `patchKeyedChildren`。

![image-20230328160349044](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230328160349044.png)

### Teleport.process & Suspense.process

在处理 **普通dom元素 `Element` 与Vue组件 `Component`** 的渲染之前，我们先来了解一下 Vue 3 新增的 `teleport` 传送组件和 `suspense` 异步组件吧。

在上面的 `patch` 函数中，`Teleport` 和 `Suspense` 在 `createVNode` 阶段，会生成 **相对特殊的 `VNode` 对象**，在 `process` 过程中，直接调用 `Vnode` 的 `process()` 方法。

> 这两个方法都接收一个 `internals` 参数，包含 `renderer.ts` 中定义的一系列挂载与更新的方法
>
> ```js
> const internals = {
>     p: patch,
>     um: unmount,
>     m: move,
>     r: remove,
>     mt: mountComponent,
>     mc: mountChildren,
>     pc: patchChildren,
>     pbc: patchBlockChildren,
>     n: getNextHostNode,
>     o: options
> }
> ```
>

#### 1. Teleport

作为新增组件，它的作用是 **将组件内部的内容挂载到指定元素下**，所以它在挂载和更新时需要单独处理。

而内部的逻辑与 `fragment` 有点儿类似：

1. **首次渲染**

与 `fragment` 一样需要先设置锚点，然后根据 `to` 属性查找指定挂载元素 `target`。

如果 `target` 存在则将锚点插入进去，然后根据 `disabled` 配置来确认挂载对象，通过 `mountChildren` 将内容插入进目标元素中。

2. **派发更新**

在更新时，一样会读取 `disabled` 和 `to` 两个属性的配置，但是首先会与 `fragment` 一样根据内部的动态节点等进行子节点内容先进行更新。

然后判断 `disabled` 和 `to` 是否有变化，如果有变化则会通过 `moveTeleport` 对组件内部的内容进行移动。

最后通过 `updateCssVars` 更新 `data-v` 属性，处理 `css` 变量和作用域等。

大致过程如下：

![image-20230329164519592](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230329164519592.png)

> 图中对 `patchChildren` 进行了省略，与上面 `processFragment` 的方法是一样的。

#### 2. Suspense

Vue 3 文档中提示的是这是一项 **实验性功能**，用来批量管理异步组件树（感觉有点儿类似于 `Promise.all()`）。

所以它的场景会有两种：加载中与加载结束。`Suspense` 提供两个插槽：`default` 和 `fallback`，其中 `fallback` 用来显示加载中状态，当加载结束后，会卸载 `pending` 状态的 `fallback` 内容然后加载异步组件的结果（也就是 `default` 插槽内的内容）。并且只有当 `default` 插槽内的 **根节点发生改变时**，才会重新触发加载中状态。

所以它的处理过程就是 **首次解析时会重新创建 `default` 与 `fallback` 两个插槽中的节点信息，然后根据 `default` 插槽中的内容加载状态，来确定当前是否需要更新，并且会抛出相应的事件**。

> 这个看起来有点儿复杂，以后再详细的解析吧~

### processComponent 组件处理

对 `Component` 自定义 Vue 组件的处理，同样会区分 `n1 == null` 的情况来确认是挂载还是更新；Vue 中内置的 `KeepAlive、Translation`  等组件也一样会在这里进行处理。

如果是 `KeepAlive` 组件中包装的组件，会设置标志位 `shapeFlag` 为 `ShapeFlags.COMPONENT_KEPT_ALIVE（1 << 9 = 512）`，因为 `KeepAlive` 中的组件会被缓存，如果再次切换的话，需要恢复缓存状态，所以在组件重新 **挂载** 时会执行另外的逻辑 `parent.ctx.activate()`；非 `KeepAlive` 包裹的组件则直接调用 `mountComponent` 执行组件挂载。

而组件 **更新** 时，则只需要直接调用 `updateComponent` 更新组件内容。

在 `mountComponent` 过程中，会对该组件生成的 `VNode` 进行调整，通过 `createComponentInstance` 方法创建一个 **组件实例** 更新到 `VNode` 对象的 `component` 属性上，最后通过 `setupRenderEffect` 设置一个 `renderEffect`（即将组件的渲染作为副作用函数），进行组件模板中的数据依赖收集，并执行一次副作用函数实现组件的首次渲染（数据更新时就会触发这个 `renderEffect` 再次执行，更新 dom，组件实例一样有一个  `isMounted` 属性用来区分是首次渲染还是更新）。

例如我们上面的例子，有一个多根组件 `FragmentOne`，在引入到 `App.vue` 中进行解析的时候，会对 `FragmentOne` 创建一个 `VNode` 对象，如下图：

![image-20230330141119632](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230330141119632.png)

> 这个组件因为是直接使用的，所以会直接调用 `mountComponent` 方法。

此时会调用 `createComponentInstance` 为 `VNode` 对象创建一个组件实例：

![image-20230330141457207](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230330141457207.png)

然后通过 `setupRenderEffect` 创建渲染函数副作用。在这个副作用函数中，它对应的执行函数就是组件的解析与更新函数：`componentUpdateFn`。在 **非SSR** 项目中，会通过 `renderComponentRoot(instance)` 对组件内容进行解析，得到一个组件内容对应的标准格式子元素 `VNode` 对象—— `subTree`，最后会通过 `patch` 对 `subTree` 进行解析和更新。

> 当然首次挂载的过程中还会对一些属性进行处理，保证后续进行更新时能正常对比。

而在更新阶段，**首先会通过 `shouldUpdateComponent` 比较新旧节点的信息（例如 `props` 参数、`slots` 插槽内容等是否改变）来确定是否需要对该组件进行全量更新**，如果都没改变则直接继承原来的 dom 节点和 `VNode` 对象。

![image-20230330163221643](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230330163221643.png)

