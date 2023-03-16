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

这里的停止条件是 **只要遍历结束新旧节点数组任意一个，则立即停止遍历**。
