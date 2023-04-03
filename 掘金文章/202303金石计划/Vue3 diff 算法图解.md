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

## processFunctions - 节点实际处理过程

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

### mountStaticNode - 挂载静态节点

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

### processFragment - 多根节点处理

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

### processElement HTML元素处理

在解析模板生成 `VNode` 的过程中，没有指定节点类型是默认都会设置 `shapeFlag` 为 `ShapeFlags.ELEMENT` （512），也就是原生的 HTML 节点类型；大部分时候，我们所说的 diff 算法核心部分也发生在这个过程中。

与 `processComponent` 类似，`Element` 元素的处理主要也只区分 `oldVnode` （也就是方法中的 `n1`）是否为 `null`，如果是，则代表是首次渲染；如果不是，则代表是对这个节点进行更新。

根据这两种情况，源码中分别定义了两个方法：`mountElement` 挂载节点、`patchElement` 更新节点。

`mountElement` 的过程比较复杂，包含了根节点（这个元素节点）创建、内容（文本还是包含子节点）处理、样式和类名绑定、自定义指令、生命周期监听等。

而 `patchElement` 的过程也同样复杂，除了与 `mount` 阶段一样需要处理样式类名绑定、自定义指令等内容之外，还要比较新旧节点内容进行 `patch` 相关更新函数的处理。

![image-20230330180756383](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230330180756383.png)

## patchChildren - 两种子节点 Diff 方式

在上面的不同类型的 `VNode` 节点的处理过程中，自定义组件 `Component`、传送组件 `Teleport`、多根节点 `Fragment` 和 原始 HTML 节点 `Element` 在 `patch` 更新过程中，**在处理子节点时** 都有可能会调用 `patchChildren` 来处理子节点的更新。

> 子节点更新的处理方式有两种：`patchBlockChildren` 和 `patchChildren`，其中 `patchBlockChildren` 一般是在 **动态节点 `dynamicChildren`** 确定时调用，内部会直接 **按照新的节点的动态子节点 `dynamicChildren` 数组的长度，遍历子节点数组并通过 `patch` 方法对比旧的子节点数组同位置元素**。
>
> 而 `patchChildren` 则是在节点不存在 `dynamicChildren` 时对所有子节点数组进行全量的对比更新。

> *关于 `block` 和 `PatchFlags` 的相关内容，也可以查看 《Vue.js 设计与实现》一书的第十七章第一节：编译优化 - 动态节点收集与补丁标志*。

在 `patchChildren` 过程中，会判断节点的 `patchFlag` 标志位，来确定 **子节点数组是否配置了 `key` 属性**。如果 **存在 key**，则会通过 `patchKeyedChildren` 对 **新旧所有子节点进行 `diff` 处理，详细对比可复用节点并调用 `patch` 进行节点的最小量更新**；而对于 **不存在 key** 的子节点数组，则调用 `patchUnkeyedChildren` 方法 **按照新旧子节点数组中的最小长度，遍历最小长度下 新旧节点同位置的元素调用 `patch` 方法进行对比，遍历结束后在处理剩余节点元素（新的挂载旧的移除）**。

### patchUnkeyedChildren - 无 key 子节点处理

上面说了 `patchUnkeyedChildren` 会按照新旧子节点数组的 **最小长度** 进行遍历，所以首先会获取他们的长度进行对比得到较小的那个 `length`：

```js
c1 = c1 || EMPTY_ARR
c2 = c2 || EMPTY_ARR
const oldLength = c1.length
const newLength = c2.length
const commonLength = Math.min(oldLength, newLength)
```

然后通过这个最小长度 `commonLength` 来进行遍历，处理 **新旧数组的同位置的子节点**：

```js
let i
for (i = 0; i < commonLength; i++) {
  const nextChild = (c2[i] = optimized
    ? cloneIfMounted(c2[i] as VNode)
    : normalizeVNode(c2[i]))
  patch(c1[i], nextChild, container, ... )
}
```

最后在处理剩余元素，移除旧的添加新的：

```js
if (oldLength > newLength) {
  // remove old
  unmountChildren(c1, ... , commonLength)
} else {
  // mount new
  mountChildren(c2, ..., commonLength)
}

const unmountChildren = (children, ... , start = 0) => {
  for (let i = start; i < children.length; i++) {
    unmount(children[i], ...)
  }
}
const mountChildren = (children, container, ... , start = 0) => {
  for (let i = start; i < children.length; i++) {
    const child = (children[i] = optimized
      ? cloneIfMounted(children[i] as VNode)
      : normalizeVNode(children[i]))
    patch(null,child,container, ...)
  }
}
```

> 因为不存在 `key`，所以深入对比新旧节点的变化更加消耗性能，不如直接 **当做位置没有发生改变，直接更新同位置节点**。

### patchKeyedChildren - 核心 Diff 过程

当节点 **具有 `key` 属性时**，节点更新时就会进行我们常说的 diff 过程，核心也就是为了 **dom 节点复用**，把相同 `key` 属性的节点视为同一节点，根据属性的实际变化来更新具体的 dom 属性，以达到最少操作的目的。

在 Vue 2 中，对于这种情况采用的是 **双端对比算法** 来完成 **新旧节点数组的全量对比**，**但是这种方法不是最快的**。

Vue 3 在此基础上，借鉴了 `ivi` 和 `inferno` 两个框架所用到的 **快速 Diff 算法**，并在此基础上进行了扩展，得到了如今源码中使用的 `diff` 算法。

因为源码比较长，我将过程简化后以两个字符串数组进行比较：

```js
const list = document.querySelector('#process');

const isSameVNodeType = (n1, n2) => (n1 === n2);
const unmount = (node) => {
  console.log('unmount', node);
};
const patch = (n1, n2) => {
  console.log('patch', n1, n2);
};
const move = (node, anchor) => {
  console.log('move', node, 'anchor', anchor);
};

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i;let j;let u;let v;let c;
  const len = arr.length;
  for (i = 0;i < len;i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}


// 正式开始
// 定义新旧节点数据
const c1 = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const c2 = ['a', 'b', 'e', 'd', 'h', 'f', 'g'];

// 设置初始数据
let i = 0;
const l2 = c2.length;
let e1 = c1.length - 1; // prev ending index
let e2 = l2 - 1; // next ending index

// 1. sync from start
while (i <= e1 && i <= e2) {
  const n1 = c1[i];
  const n2 = c2[i];
  if (isSameVNodeType(n1, n2)) {
    patch(n1, n2);
  } else {
    break;
  }
  i++;
}

// 2. sync from end
while (i <= e1 && i <= e2) {
  const n1 = c1[e1];
  const n2 = c2[e2];
  if (isSameVNodeType(n1, n2)) {
    patch(n1, n2);
  } else {
    break;
  }
  e1--;
  e2--;
}

// 3. common sequence + mount
if (i > e1) {
  if (i <= e2) {
    const nextPos = e2 + 1;
    while (i <= e2) {
      patch(null, c2[i]);
      i++;
    }
  }
}

// 4. common sequence + unmount
else if (i > e2) {
  while (i <= e1) {
    unmount(c1[i]);
    i++;
  }
}

// 5. unknown sequence
else {
  const s1 = i; // prev starting index
  const s2 = i; // next starting index

  // 5.1 build key:index map for newChildren
  const keyToNewIndexMap = new Map();
  for (i = s2;i <= e2;i++) {
    const nextChild = c2[i];
    if (nextChild != null) {
      keyToNewIndexMap.set(nextChild, i);
    }
  }

  // 5.2 loop through old children left to be patched and try to patch
  // matching nodes & remove nodes that are no longer present
  let j;
  let patched = 0;
  const toBePatched = e2 - s2 + 1;
  let moved = false;
  let maxNewIndexSoFar = 0;
  const newIndexToOldIndexMap = new Array(toBePatched);

  for (i = 0;i < toBePatched;i++) {
    newIndexToOldIndexMap[i] = 0;
  }

  for (i = s1;i <= e1;i++) {
    const prevChild = c1[i];
    if (patched >= toBePatched) {
      // all new children have been patched so this can only be a removal
      unmount(prevChild);
      continue;
    }

    let newIndex;
    if (prevChild != null) {
      newIndex = keyToNewIndexMap.get(prevChild);
    } else {
      // key-less node, try to locate a key-less node of the same type
      for (j = s2;j <= e2;j++) {
        if (
          newIndexToOldIndexMap[j - s2] === 0 &&
            isSameVNodeType(prevChild, c2[j])
        ) {
          newIndex = j;
          break;
        }
      }
    }

    if (newIndex === undefined) {
      unmount(prevChild);
    } else {
      newIndexToOldIndexMap[newIndex - s2] = i + 1;
      if (newIndex >= maxNewIndexSoFar) {
        maxNewIndexSoFar = newIndex;
      } else {
        moved = true;
      }
      patch(prevChild, c2[newIndex]);
      patched++;
    }
  }

  // 5.3 move and mount
  const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
  j = increasingNewIndexSequence.length - 1;
  for (i = toBePatched - 1;i >= 0;i--) {
    const nextIndex = s2 + i;
    const nextChild = c2[nextIndex];
    const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1] : null;
    if (newIndexToOldIndexMap[i] === 0) {
      // mount new
      patch(null, nextChild);
    } else if (moved) {
      if (j < 0 || i !== increasingNewIndexSequence[j]) {
        // move(nextChild, container, anchor, MoveType.REORDER)
        move(nextChild, anchor);
      } else {
        j--;
      }
    }
  }
}
```

> 这段代码可以直接在控制台运行

假设我们有这样的节点变化：

```
旧节点：['a', 'b', 'c', 'd', 'e', 'f', 'g']

新节点：['a', 'b', 'e', 'd', 'h', 'f', 'g']
```

经过的 diff 过程如下：

![image-20230331161318471](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331161318471.png)

其中可以分为以下几个大的步骤：

1. **从头开始、同位置比较**，直到 **遇到 `key` 不一样的节点**（也就是第三位 `c` 和 `e`，此时 `i` = 2）
2. **从尾开始、倒序同位置比较**，直到 **遇到 `key` 不一样的节点或者第一步的停止位 `i`**（也就是遇到倒数第三位 `e` 和 `h`，此时 `e1` 和 `e2` 都等于 4）
3. 经过前两步之后，剩下的节点虽然有相同节点，但是顺序已经改变，所以需要重新处理。这里与 Vue 2 中的 **双端均不相同** 的情况有些类似的过程，都会将一个节点数组转为 `map` 形式然后遍历另一个数组进行匹配和更新。但是这里也一样有一些不同，我们在后面分析时进行详细说明。

> 这里可以发现 **实际执行过程并没有完全匹配代码中的 5 种情况**，这是因为 **三和四这两种情况都是发生在前两步结束后已经有一个节点数组已经全部遍历完毕**。

### 快速 Diff 算法

在分析 diff 算法之前，先了解一下这个 **快速 diff 算法** 的“快速”主要是体现在哪个方面。

根据《Vue.js 设计与实现》的说明：**快速 Diff 算法包含预处理步骤，这其实是借鉴了纯文本 Diff 算法的思路。在纯文本 Diff 算法中，存在对两段文本进行预处理的过程**。

在这个过程中，会 **分别查找头部完全一致的内容与尾部完全一致的内容，将其排除后再比较剩余内容**。

例如：

![image-20230331165142312](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331165142312.png)

两段文本中只需要更新的仅仅只有中间部分，需要将 `vue` 改为 `react`。

*接下来，我们以这个例子进行整个 diff 过程的解析~*

### 1. 从头查找最长相同 key 节点

我们假设现在有这样的内容：

![image-20230331170334019](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331170334019.png)

它在第一步结束后，更新到了第二个节点；`i` 会停留在第一个不同的节点位置。

![image-20230331172031058](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331172031058.png)

此时剩余内容为：

```
旧节点： ['c', 'd', 'e', 'f', 'g'];
新节点： ['e', 'd', 'h', 'f', 'g'];
```

### 2. 从尾部倒序查找最长相同 key 节点

在第二步结束之后，会进行这样的更新：

![image-20230331172957109](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331172957109.png)

这一步不会处理 `i` 的位置，而是从两个数组的最末尾节点依次按顺序对比同位置节点：

![image-20230331173102486](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331173102486-1680255065224-2.png)

### 3. 旧节点数组被遍历结束

因为最初的例子中没有触发代码中的第三、四步，所以这里的例子进行一下调整：

```
旧节点： ['c', 'd', 'e', 'f', 'g'];
新节点： ['c', 'd', 'h', 'j', 'e', 'f', 'g'];
```

此时过程如下：

![image-20230331173641313](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331173641313.png)

![image-20230331175221206](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331175221206.png)

**也就是对新节点数组剩余元素进行依次遍历和挂载**

### 4. 新节点数组被遍历结束

> 第 三、四、五 三个步骤属于 **互斥情况**，所以源码中采用的是 `if` 判断

因为这三个情况不一样，所以这一步需要对前面的例子再进行修改，假设新示例如下：

```
旧节点： ['c', 'd', 'h', 'j', 'e', 'f', 'g'];
新节点： ['c', 'd', 'e', 'f', 'g'];
```

此时的步骤就刚好与第三步相反：

![image-20230331180836302](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331180836302.png)

![image-20230331180324169](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230331180324169.png)

**也就是对旧节点数组剩余元素进行依次遍历和卸载**

### 5. 剩余节点对比（移动、更新、卸载）

> 只有在这一步才用到了 **最长递增子序列** 算法。

在这一步开始之前，我们先了解一下什么是 **最长递增子序列算法**。

#### 5.0 最长递增子序列

> "**在一个给定的数值序列中，找到一个子序列，使得这个子序列元素的数值依次递增，并且这个子序列的长度尽可能地大。最长递增子序列中的元素在原序列中不一定是连续的**"。
>
> —— 维基百科

对于以下的原始序列

```
0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15
```

最长递增子序列为：

```
0, 2, 6, 9, 11, 15
```

值得注意的是，生成的递增子序列数组中的元素，在原数组中对应的元素下标不一定是连续的。

![image-20230403093717347](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230403093717347.png)

**在 Vue 3 中，这个算法被提取成了一个工具方法 `getSequence`，位于 `renderer.ts` 文件的最底部**。并且，Vue 3 中最这个方法进行了改造，最终生成的子序列 **是以可生成 `最长` 子串数组的可用元素的 `最大索引`**。

如果使用 Vue 3 中的 `getSequence` 方法来处理上面的这个原始序列，会得到这样的结果：

```
0, 4, 6, 9, 13, 15
```

区别如下：

![image-20230403101532141](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230403101532141.png)

`getSequence` 方法的大致过程如下：

1. 复制一份 `arr` 数组，用于记录每个元素在递增子序列中的前驱元素。
2. 初始化 `result` 数组为 `[0]`，用于记录递增子序列的索引。
3. 遍历 `arr` 数组，如果当前元素不为 0，则在递增子序列 `result` 中查找比当前元素小的最大元素的索引 `j`。
4. 如果 `arr[j] < arr[i]`，则将 `p[i]` 赋值为 `j`，并将 `i` 添加到递增子序列 `result` 中。
5. 否则，使用二分查找在递增子序列 `result` 中查找比当前元素小的最大元素的索引 `u`。
6. 如果 `arr[i]` 小于 `result[u]`，则将 `p[i]` 赋值为 `result[u-1]`。
7. 将 `i` 添加到递增子序列 `result` 中。
8. 通过 `p` 数组回溯递增子序列，生成最终的递增新索引序列。

#### 5.1 新节点剩余元素构建 Map

这一步就很简单了，直接循环 `newChildren` 的 `i` 到 `e2` 之间的剩余元素，组成一个 `key => index` 的 `Map`。

```js
const s1 = (s2 = i);

const keyToNewIndexMap = new Map();
for (i = s2;i <= e2;i++) {
  const nextChild = c2[i];
  if (nextChild != null) {
    keyToNewIndexMap.set(nextChild, i);
  }
}
```

#### 5.2 与旧节点的对比复用

在 `newChildren` 的对应关系 `keyToNewIndexMap` 创建好之后，就会遍历 `oldChildren` 对比 `key` 相同的 `VNode` 实例进行复用和更新。

而对于比较结束后依旧剩余的旧节点则直接进行 `unmount` 卸载（因为剩余的旧节点 `key` 都不能复用，所以直接视为废弃节点）。

简化代码如下：

```typescript
let j;
let patched = 0; // 已更新节点数
const toBePatched = e2 - s2 + 1; // newChildren 剩余节点数（需要更新）
let moved = false; // 节点位置是否移动标识
let maxNewIndexSoFar = 0; // 当前元素在新节点数组最大索引
const newIndexToOldIndexMap = new Array(toBePatched); // 新旧节点索引对应关系

for (i = 0;i < toBePatched;i++) {
  newIndexToOldIndexMap[i] = 0;
}

// 遍历旧节点数组
for (i = s1;i <= e1;i++) {
  const prevChild = c1[i]; // 当前旧节点元素
  if (patched >= toBePatched) {
    // 如果以更新节点数大于等于需要更新节点数，
    // 说明新节点以全部更新，剩余旧节点直接移除，并跳出当次循环
    unmount(prevChild);
    continue;
  }

  // 判断当前节点是否有key，存在则在 map 中查找，
  // 不存在则遍历新节点剩余数组的相同节点并更新索引
  let newIndex;
  // 这里是判断 prevChild.key != null
  if (prevChild != null) {
    newIndex = keyToNewIndexMap.get(prevChild);
  } else {
    // key-less node, try to locate a key-less node of the same type
    for (j = s2;j <= e2;j++) {
      if (
        newIndexToOldIndexMap[j - s2] === 0 &&
          isSameVNodeType(prevChild, c2[j])
      ) {
        newIndex = j;
        break;
      }
    }
  }

  if (newIndex === undefined) {
    // 依然没有找到同key或者同 VNodeType的新节点，则卸载旧节点
    unmount(prevChild);
  } else {
    // 找到了对应新节点，对比索引位置设置 moved 标识，执行 patch 更新
    newIndexToOldIndexMap[newIndex - s2] = i + 1;
    if (newIndex >= maxNewIndexSoFar) {
      // 如果新节点的索引大于等于 maxNewIndexSoFar，
      // 则将 maxNewIndexSoFar 更新为新节点的索引
      maxNewIndexSoFar = newIndex;
    } else {
      // 说明向前移动了
      moved = true;
    }
    patch(prevChild, c2[newIndex]);
    patched++; // 已更新 +1
  }
}
```

为了能更加体现整个过程中变化，我们将上面的例子进行一下扩充：

```
旧节点： ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
新节点： ['a', 'b', 'e', 'd', 'h', 'g', 'f', 'o', 'p', 'r', 'k', 'j', 'l', 'm', 'n'];
```

其中包含了前两步的 **头部相同节点，尾部相同节点**，中间部分也包含了卸载、移动、更新三种情况，并且数据量已经比较大，可以看出整体过程。

在第一步新节点数组索引 `Map` 对象构建结束之后，我们会的得到一个 `size` 为 10 的 `keyToNewIndexMap`，并且此时的 **需要更新节点数标识 `toBePatched` 为 10**（因为都有 `key` 属性，所以此时 `toBePatched = keyToNewIndexMap.size()`）。

然后会遍历旧节点数组查找 `key` 相同的节点的下标 `newIndex`（如果找不到还会在 `newChildren` 新节点的剩余数组中查找 **未被使用过 `newIndexToOldIndexMap[j - s2] === 0` 且同类型判断 `isSameVNodeType` 为 `true` 的节点**，并将它的 `index` 下标作为 `newIndex`）。

这个过程结束后，如果 `newIndex` 依然是 `undefined`，则证明这个节点无法被复用，直接卸载；如果存在的话，则调用 `patch` 对比更新新旧节点元素。

大致过程如下：

![image-20230403131816154](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230403131816154.png)

![image-20230403125139210](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230403125139210.png)

> 此时新节点剩余数组中仍然还有剩余元素没有被挂载，而且节点顺序不对，就需要进行最后一步：新建节点与位置移动

#### 5.3 新建节点与位置移动

在这一步的开始，会判断 `5.2` 结束后的 `moved` 标识，判断是否需要进行移动判定；如果需要的话，会通过 `getSequence` 查找位置更新的最长递增子串。

```js
const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
```

> 这里的 `newIndexToOldIndex` 记录了新节点剩余数组中，每个节点的在旧节点剩余数组中的位置下标，如果不存在记录则为 0。

此时数据如下：

![image-20230403132504919](./docs-images/Vue3%20diff%20%E7%AE%97%E6%B3%95%E5%9B%BE%E8%A7%A3/image-20230403132504919.png)







