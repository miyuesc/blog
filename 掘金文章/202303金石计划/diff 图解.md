# Vue2 diff 算法图解

## 前言

看 Vue 2 的源代码已经很久了，从用 flow 到如今使用 TypeScript，我每次都会打开它的源代码看一看，但是每次都只看到了 **数据初始化** 部分，也就是 `beforeMount` 的阶段，对于如何生成 VNode（Visual Dom Node， 也可以直接称为 vdom） 以及组件更新时如何比较 VNode（diff）始终没有仔细研究，只知道采用了 **双端 diff 算法**，至于这个双端是怎么开始怎么结束的也一直没有去看过，所以这次趁写文章的机会仔细研究一下。如果内容有误，希望大家能帮我指出，非常感谢~

## 什么是 diff ?

在我的理解中，diff 指代的是 `differences`，即 **新旧内容之间的区别计算**；Vue 中的 diff 算法，则是通过一种 **简单且高效** 的手段快速对比出 **新旧 VNode 节点数组之间的区别** 以便 **以最少的 dom 操作来更新页面内容**。

此时这里有两个必须的前提：

1. 对比的是 VNode 数组
2. 同时存在新旧两组 VNode 数组

所以它一般只发生在 **数据更新造成页面内容需要更新时执行**，即 `renderWatcher.run()`。

## 为什么是 VNode ?

上面说了，diff 中比较的是 VNode，而不是真实的 dom 节点，相信为什么会使用 VNode 大部分人都比较清楚，笔者就简单带过吧😝~

在 Vue 中使用 VNode 的原因大致有两个方面：

1. VNode 作为框架设计者根据框架需求设计的 JavaScript 对象，本身属性相对真实的 dom 节点要简单，并且操作时不需要进行 dom 查询，可以大幅优化计算时的性能消耗
2. 在 VNode 到真实 dom 的这个渲染过程，可以根据不同平台（web、微信小程序）进行不同的处理，生成适配各平台的真实 dom 元素

在 diff 过程中会遍历新旧节点数据进行对比，所以使用 VNode 能带来很大的性能提升。

## 流程梳理

在网页中，真实的 dom 节点都是以 **树** 的形式存在的，根节点都是 `<html>`，为了保证虚拟节点能与真实 dom 节点一致，VNode 也一样采用的是树形结构。

如果在组件更新时，需要对比全部 VNode 节点的话，新旧两组节点都需要进行 **深度遍历** 和比较，会产生很大的性能开销；所以，Vue 中默认 **同层级节点比较**，即 **如果新旧 VNode 树的层级不同的话，多余层级的内容会直接新建或者舍弃**，只在同层级进行 diff 操作。

一般来说，diff 操作一般发生在 `v-for` 循环或者有 `v-if/v-else` 、`component` 这类 **动态生成** 的节点对象上（静态节点一般不会改变，对比起来很快），并且这个过程是为了更新 dom，所以在源码中，这个过程对应的方法名是 `updateChildren`，位于 `src/core/vdom/patch.ts` 中。如下图：

![image-20230316094319181](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316094319181.png)

> 这里回顾一下 Vue 组件实例的创建与更新过程：
>
> 1. 首先是 `beforeCreate` 到 `created` 阶段，主要进行数据和状态以及一些基础事件、方法的处理
>
> 2. 然后，会调用 `$mount(vm.$options.el)` 方法进入 `Vnode` 与 dom 的创建和挂载阶段，也就是 `beforeMount` 到 `mounted` 之间（组件更新时与这里类似）
>
> 3. 原型上的 `$mount` 会在 `platforms/web/runtime-with-compiler.ts` 中进行一次重写，原始实现在 `platforms/web/runtime/index.ts` 中；在原始实现方法中，其实就是调用 `mountComponent` 方法执行 `render`；而在 `web` 下的 `runtime-with-compiler` 中则是增加了 **模板字符串编译** 模块，会对 `options` 中的的 `template` 进行一次解析和编译，转换成一个函数绑定到 `options.render` 中
>
> 4. `mountComponent` 函数内部就是 **定义了渲染方法 `updateComponent = () => (vm._update(vm._render())`，实例化一个具有 `before` 配置的 `watcher` 实例（即 `renderWatcher`），通过定义 `watch` 观察对象为 刚刚定义的 `updateComponent ` 方法来执行 首次组件渲染与触发依赖收集**，其中的 `before` 配置仅仅配置了触发 `beforeMount/beforeUpdate` 钩子函数的方法；这也是为什么在 `beforeMount` 阶段取不到真实 dom 节点与 `beforeUpdate` 阶段获取的是旧 dom 节点的原因
>
> 5. `_update` 方法的定义与 `mountComponent` 在同一文件下，其核心就是 **读取组件实例中的 `$el`（旧 dom 节点）与 `_vnode`（旧 VNode）与 `_render()` 函数生成的 `vnode` 进行 `patch` 操作**
>
> 6. `patch` 函数首先对比 **是否具有旧节点**，没有的话肯定是新建的组件，直接进行创建和渲染；如果具有旧节点的话，则通过 `patchVnode` 进行新旧节点的对比，**并且如果新旧节点一致并且都具有 `children` 子节点，则进入 `diff` 的核心逻辑 —— `updateChildren` 子节点对比更新**，这个方法也是我们常说的 `diff` 算法

## 前置内容

既然是对比新旧 VNode 数组，那么首先肯定有 **对比** 的判断方法：`sameNode(a, b)`、新增节点的方法 `addVnodes`、移除节点的方法 `removeVnodes`，当然，即使 `sameNode` 判断了 VNode 一致之后，依然会使用 `patchVnode` 对单个新旧 VNode 的内容进行深度比较，确认内部数据是否需要更新。

### sameNode(a, b)

这个方法就一个目的：**比较新旧节点是否相同**。

在这个方法中，首先比较的就是 a 和 b 的 `key` 是否相同，这也是为什么 Vue 在文档中注明了 `v-for、v-if、v-else` 等动态节点必须要设置 `key` 来标识节点唯一性，如果 `key` 存在且相同，则只需要比较内部是否发生了改变，一般情况下可以减少很多 dom 操作；而如果没有设置的话，则会直接销毁重建对应的节点元素。

然后会比较是不是异步组件，这里会比较他们的构造函数是不是一致。

然后会进入两种不同的情况比较：

- 非异步组件：标签一样、都不是注释节点、都有数据、同类型文本输入框
- 异步组件：旧节点占位符和新节点的错误提示都为 `undefined`

函数整体过程如下

![image-20230315153803745](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230315153803745.png)

### addVnodes

顾名思义，添加新的 VNode 节点。

该函数接收 6 个参数：`parentElm` 当前节点数组父元素、`refElm` 指定位置的元素、`vnodes` **新的虚拟节点数组**、`startIdx` 新节点数组的插入元素开始位置、`endIdx` 新节点数组的插入元素结束索引、`insertedVnodeQueue` 需要插入的虚拟节点队列。

函数内部会 **从 `startIdx` 开始遍历 `vnodes` 数组直到 `endIdx` 位置**，然后调用 `createElm` 依次在 `refElm` 之前创建和插入 `vnodes[idx]` 对应的元素。

当然，在这个 `vnodes[idx]` 中有可能会有 `Component` 组件，此时还会调用 `createComponent` 来创建对应的组件实例。

> 因为整个 `VNode` 和 dom 都是一个 **树结构**，所以在 **同层级的比较之后，还需要处理当前层级下更深层次的 VNode 和 dom 处理**。

### removeVnodes

与 `addVnodes` 相反，该方法就是用来移除 VNode 节点的。

由于这个方法只是移除，所以只需要三个参数：`vnodes` **旧虚拟节点数组**、`startIdx` 开始索引、`endIdx` 结束索引。

函数内部会 **从 `startIdx` 开始遍历 `vnodes` 数组直到 `endIdx` 位置**，如果 `vnodes[idx]` 不为 `undefined` 的话，则会根据 `tag` 属性来区分处理：

- 存在 `tag`，说明是一个元素或者组件，需要 **递归处理 `vnodes[idx]` 的内容**， 触发 `remove hooks 与 destroy hooks`
- 不存在 `tag`，说明是一个 **纯文本节点**，直接从 dom 中移除该节点即可

### patchVnode

节点对比的 **实际完整对比和 dom 更新** 方法。

在这个方法中，主要包含 **九个** 主要的参数判断，并对应不同的处理逻辑：

1. 新旧 VNode 全等，则说明没有变化，**直接退出**
2. 如果新的 VNode 具有真实的 dom 绑定，并且需要更新的节点集合是一个数组的话，则拷贝当前的 VNode 到集合的指定位置
3. 如果旧节点是一个 **异步组件并且还没有加载结束的话就直接退出**，否则通过 `hydrate` 函数将新的 VNode 转化为真实的 dom 进行渲染；两种情况都会 **退出该函数**
4. 如果新旧节点都是 **静态节点** 并且 `key` 相等，或者是 `isOnce` 指定的不更新节点，也会直接 **复用旧节点的组件实例** 并 **退出函数**
5. 如果新的 VNode 节点具有 `data` 属性并且有配置 `prepatch` 钩子函数，则执行 `prepatch(oldVnode, vnode)` 通知进入节点的对比阶段，一般这一步会配置性能优化
6. 如果新的 VNode 具有 `data` 属性并且递归改节点的子组件实例的 vnode，依然是可用标签的话，`cbs` 回调函数对象中配置的 `update` 钩子函数以及 `data` 中配置的 `update` 钩子函数
7. **如果新的 VNode 不是文本节点的话，会进入核心对比阶段**：
   - 如果新旧节点都有 `children` 子节点，则进入 `updateChildren` 方法对比子节点
   - 如果旧节点没有子节点的话，则直接创建 VNode 对应的新的子节点
   - 如果新节点没有子节点的话，则移除旧的 VNode 子节点
   - 如果都没有子节点的话，并且旧节点有文本内容配置，则清空以前的 `text` 文本
8. 如果新的 VNode 具有 `text` 文本（是文本节点），则比较新旧节点的文本内容是否一致，否则进行文本内容的更新
9. 最后调用新节点的 `data` 中配置的 `postpatch` 钩子函数，通知节点更新完毕

简单来说，`patchVnode` 就是在 **同一个节点 更新阶段 进行新内容与旧内容的对比，如果发生改变则更新对应的内容；如果有子节点，则“递归”执行每个子节点的比较和更新**。

而 **子节点数组的比较和更新，则是 diff 的核心逻辑**，也是面试时经常被提及的问题之一。

下面，就进入 `updateChildren` 方法的解析吧~

## `updateChildren` diff 核心解析

首先，我们先思考一下 **以新数组为准比较两个对象数组元素差异** 有哪些方法？

一般来说，我们可以通过 **暴力手段直接遍历两个数组** 来查找数组中每个元素的顺序和差异，也就是 **简单 diff 算法**。

即 **遍历新节点数组，在每次循环中再次遍历旧节点数组 对比两个节点是否一致，通过对比结果确定新节点是新增还是移除还是移动**，整个过程中需要进行 m*n 次比较，所以默认时间复杂度是 On。

这种比较方式在大量节点更新过程中是非常消耗性能的，所以 Vue 2 对其进行了优化，改为 `双端对比算法`，也就是 `双端 diff`。

### 双端 diff 算法

顾名思义，**双端** 就是 **从两端开始分别向中间进行遍历对比** 的算法。

在 `双端 diff` 中，分为 **五种比较情况**：

1. 新旧头相等
2. 新旧尾相等
3. 旧头等于新尾
4. 旧尾等于新头
5. 四者互不相等

其中，前四种属于 **比较理想的情况**，而第五种才是 **最复杂的对比情况**。

> 判断相等即 `sameVnode(a, b)` 等于 `true`

下面我们通过一种预设情况来进行分析。

### 1. 预设新旧节点状态

为了尽量同时演示出以上五种情况，我预设了以下的新旧节点数组：

- 作为初始节点顺序的旧节点数组 `oldChildren`，包含 1 - 7 共 7 个节点
- 作为乱序后的新节点数组 `newChildren`，也有 7 个节点，但是相比旧节点减少了一个 `vnode 3` 并增加了一个 `vnode 8`

在进行比较之前，首先需要 **定义两组节点的双端索引**：

```js
let oldStartIdx = 0
let oldEndIdx = oldCh.length - 1
let oldStartVnode = oldCh[0]
let oldEndVnode = oldCh[oldEndIdx]

let newStartIdx = 0
let newEndIdx = newCh.length - 1
let newStartVnode = newCh[0]
let newEndVnode = newCh[newEndIdx]
```

> 复制的源代码，其中 `oldCh` 在图中为 `oldChildren`，`newCh` 为 `newChildren`

然后，我们定义 **遍历对比操作的停止条件**：

```js
while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx)
```

这里的停止条件是 **只要新旧节点数组任意一个遍历结束，则立即停止遍历**。

此时节点状态如下：

![image-20230316200208534](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316200208534.png)

### 2. 确认 vnode 存在才进行对比

为了保证新旧节点数组在对比时不会进行无效对比，会首先排除掉两个数组 **起始部分内、值为 `Undefined` 的数据**。

```js
if (isUndef(oldStartVnode)) {
  oldStartVnode = oldCh[++oldStartIdx]
} else if (isUndef(oldEndVnode)) {
  oldEndVnode = oldCh[--oldEndIdx]
```

![image-20230316204314495](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316204314495.png)

当然我们的例子中没有这种情况，可以忽略。

### 3. 旧头等于新头

此时相当于新旧节点数组的两个 **起始索引** 指向的节点是 **基本一致的**，那么此时会调用 `patchVnode` 对两个 vnode 进行深层比较和 dom 更新，并且将 **两个起始索引向后移动**。即：

```js
if (sameVnode(oldStartVnode, newStartVnode)) {
  patchVnode(
    oldStartVnode,
    newStartVnode,
    insertedVnodeQueue,
    newCh,
    newStartIdx
  )
  oldStartVnode = oldCh[++oldStartIdx]
  newStartVnode = newCh[++newStartIdx]
}
```

这时的节点和索引变化如图所示：

![image-20230316204350420](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316204350420.png)

### 4. 旧尾等于新尾

与头结点相等类似，这种情况代表 **新旧节点数组的最后一个节点基本一致**，此时一样调用 `patchVnode` 比较两个尾结点和更新 dom，然后将 **两个末尾索引向前移动**。

```js
if (sameVnode(oldEndVnode, newEndVnode)) {
  patchVnode(
    oldEndVnode,
    newEndVnode,
    insertedVnodeQueue,
    newCh,
    newEndIdx
  )
  oldEndVnode = oldCh[--oldEndIdx]
  newEndVnode = newCh[--newEndIdx]
}
```

这时的节点和索引变化如图所示：

![image-20230316204720081](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316204720081.png)

### 5. 旧头等于新尾

这里表示的是 **旧节点数组 当前起始索引 指向的 vnode 与 新节点数组 当前末尾索引 指向的 vnode 基本一致**，一样调用 `patchVnode` 对两个节点进行处理。

但是与上面两种有区别的地方在于：这种情况下会造成 **节点的移动**，所以此时还会在 **`patchVnode` 结束之后** 通过 `nodeOps.insertBefore` 将 **旧的头节点** 重新插入到 **当前 旧的尾结点之后**。

然后，会将 **旧节点的起始索引后移、新节点的末尾索引前移**。

> 看到这里大家可能会有一个疑问，为什么这里移动的是 **旧的节点数组**，这里因为 vnode 节点中有一个属性 `elm`，会指向该 vnode 对应的实际 dom 节点，所以这里移动旧节点数组其实就是 **侧面去移动实际的 dom 节点顺序**；并且注意这里是 **当前的尾结点，在索引改变之后，这里不一定就是原旧节点数组的最末尾**。

即：

```js
if (sameVnode(oldStartVnode, newEndVnode)) {
  patchVnode(
    oldStartVnode,
    newEndVnode,
    insertedVnodeQueue,
    newCh,
    newEndIdx
  )
  canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
  oldStartVnode = oldCh[++oldStartIdx]
  newEndVnode = newCh[--newEndIdx]
}
```

此时状态如下：

![image-20230316210301883](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316210301883.png)

### 6. 旧尾等于新头

这里与上面的 旧头等于新尾 类似，一样要涉及到节点对比和移动，只是调整的索引不同。此时 **旧节点的 末尾索引 前移、新节点的 起始索引 后移**，当然了，这里的 dom 移动对应的 vnode 操作是 **将旧节点数组的末尾索引对应的 vnode 插入到旧节点数组 起始索引对应的 vnode 之前**。

```js
if (sameVnode(oldEndVnode, newStartVnode)) {
  patchVnode(
    oldEndVnode,
    newStartVnode,
    insertedVnodeQueue,
    newCh,
    newStartIdx
  )
  canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
  oldEndVnode = oldCh[--oldEndIdx]
  newStartVnode = newCh[++newStartIdx]
}
```

此时状态如下：

![image-20230316210858484](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316210858484.png)

### 7. 四者均不相等

在以上情况都处理之后，就来到了四个节点互相都不相等的情况，这种情况也是 **最复杂的情况**。

当经过了上面几种处理之后，此时的 **索引与对应的 vnode** 状态如下：

![image-20230316211057275](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316211057275.png)

可以看到四个索引对应的 vnode 分别是：vnode 3、vnode 5、 vnode 4、vnode 8，这几个肯定是不一样的。

此时也就意味着 **双端对比结束**。

后面的节点对比则是 **将旧节点数组剩余的 vnode （`oldStartIdx` 到 `oldEndIdx` 之间的节点）进行一次遍历，生成由 `vnode.key` 作为键，`idx` 索引作为值的对象 `oldKeyToIdx`**，然后 **遍历新节点数组的剩余 vnode（`newStartIdx` 到 `newEndIdx` 之间的节点），根据新的节点的 `key` 在 `oldKeyToIdx` 进行查找**。此时的每个新节点的查找结果只有两种情况：

1. **找到了对应的索引**，那么会通过 `sameVNode` 对两个节点进行对比：
   - 相同节点，调用 `patchVnode` 进行深层对比和 dom 更新，将 `oldKeyToIdx` 中对应的索引 `idxInOld` 对应的节点插入到 `oldStartIdx` 对应的 vnode 之前；并且，这里会将 **旧节点数组中 `idxInOld` 对应的元素设置为 `undefined`**
   - 不同节点，则调用 `createElm` 重新创建一个新的 dom 节点并将 **新的 vnode 插入到对应的位置**
2. 没有找到对应的索引，则直接 `createElm` 创建新的 dom 节点并将新的 vnode 插入到对应位置

> 注：这里 **只有找到了旧节点并且新旧节点一样才会将旧节点数组中 `idxInOld` 中的元素置为 `undefined`**。

最后，会将 **新节点数组的 起始索引 向后移动**。

```js
if (isUndef(oldKeyToIdx)) {
    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
  }
  idxInOld = isDef(newStartVnode.key)
    ? oldKeyToIdx[newStartVnode.key]
    : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
  if (isUndef(idxInOld)) {
    // New element
    createElm(
      newStartVnode,
      insertedVnodeQueue,
      parentElm,
      oldStartVnode.elm,
      false,
      newCh,
      newStartIdx
    )
  } else {
    vnodeToMove = oldCh[idxInOld]
    if (sameVnode(vnodeToMove, newStartVnode)) {
      patchVnode(
        vnodeToMove,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      oldCh[idxInOld] = undefined
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          vnodeToMove.elm,
          oldStartVnode.elm
        )
    } else {
      // same key but different element. treat as new element
      createElm(
        newStartVnode,
        insertedVnodeQueue,
        parentElm,
        oldStartVnode.elm,
        false,
        newCh,
        newStartIdx
      )
    }
  }
  newStartVnode = newCh[++newStartIdx]
}
```

大致逻辑如下图：

![image-20230316213015252](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316213015252.png)

## 剩余未比较元素处理

经过上面的处理之后，根据判断条件也不难看出，**遍历结束之后 新旧节点数组都刚好没有剩余元素** 是很难出现的，**当且仅当遍历过程中每次新头尾节点总能和旧头尾节点中总能有两个新旧节点相同时才会发生**，只要有一个节点发生改变或者顺序发生大幅调整，最后 **都会有一个节点数组起始索引和末尾索引无法闭合**。

那么此时就需要对剩余元素进行处理：

- 旧节点数组遍历结束、新节点数组仍有剩余，则遍历新节点数组剩余数据，分别创建节点并插入到旧末尾索引对应节点之前
- 新节点数组遍历结束、旧节点数组仍有剩余，则遍历旧节点数组剩余数据，分别从节点数组和 dom 树中移除

即：

![image-20230316214140749](./docs-images/diff%20%E5%9B%BE%E8%A7%A3/image-20230316214140749.png)

## 小节

Vue 2 的 diff 算法相对于简单 diff 算法来说，通过 **双端对比与生成索引 map 两种方式** 减少了简单算法中的多次循环操作，新旧数组均只需要进行一次遍历即可将所有节点进行对比。

其中双端对比会分别进行四次对比和移动，性能不算最优解，所以 Vue 3 中引入了 **最长递增子序列** 的方式来 **替代双端对比**，而其余部分则依然通过转为索引map 的形式利用空间扩展来减少时间复杂度，从而更高的提升计算性能。

当然本文的图中没有给出 vnode 对应的 elm 真实 dom 节点，两者的移动关系可能会给大家带来误解，建议配合 《Vue.js 设计与实现》一起阅读。

