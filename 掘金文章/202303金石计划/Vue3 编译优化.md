# Vue 3 VNode 编译优化

## 前言

在之前的 [从 CreateApp 开始学习 Vue 源码](https://juejin.cn/post/7213211041764261948) 到 [史上最详细的 Vue 3 渲染过程与 diff 图解](https://juejin.cn/post/7217693476494262329) 两篇文章中，我们已经了解了 Vue 3 在最初实例化一个 `app` 应用实例到 `mount` 渲染到页面的大致过程，也清楚了在 **数据更新时整个 dom 树与 VNode 虚拟节点树的对比更新过程**。

而在对比 VNode 进行复用更新时，提到了有很多地方涉及到了 Vue 3 中对 `template` 模板的 **优化编译**，从而实现 diff 阶段的性能提升。

那么这个 **优化**，到底体现在哪些地方呢？

这里首先先放一张 Vue playground 中提供的 组件与组件编译结果的对比图，来进行后面的分析。

![image-20230420195729102](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230420195729102.png)

## 1. PatchFlags “补丁标志”

从图中，可以看出一个 `.vue` 的 SFC 组件，最终会被编译成一个 **包含了返回一个函数的 `setup` 函数方法的 `__sfc__` 对象**。我们在 SFC 的 script 部分中定义的变量，也会出现在 `__sfc__.setup` 的函数体中，而 `setup` 函数，返回的是一个调用了多种方法来创建 **block** 和 VNode 对象的 **渲染方法**。

并且，在每一个 `create****VNode` 的方法中，并且这些方法 **第四个参数** 都是一个 **2 的 n 次方的数字**，后面也有行内注释解释了这个值代表的意思。那么这个值，就是我们的 **patchFlag**，也就是 **节点标志位**，用来表示这个节点是什么类型。

例如文中的 1 表示 **Text** 文本类型，64 表示 **STABLE_FRAGMENT** 顺序不会发生改变的多节点片段，128 表示 **KEYED_FRAGMENT** 带 key 的节点片段等等。

这些枚举值统一存放在 `packages\shared\src\patchFlags.ts` 文件中，通过 **二进制树** 的形式来表示。

```typescript
export const enum PatchFlags {
  TEXT = 1, // 动态文本
  CLASS = 1 << 1, // 包含动态的 class 配置
  STYLE = 1 << 2, // 包含动态的 style 配置
  PROPS = 1 << 3, // 包含有关联 props 属性的配置
  FULL_PROPS = 1 << 4, // 全部 props 都是动态的，一般用来标识节点绑定了 key 但是 key 会改变
  HYDRATE_EVENTS = 1 << 5, // 具有水合事件的节点
  STABLE_FRAGMENT = 1 << 6, // 顺序固定的多平级节点，一般是Vue 3 提供的 Fragment 特性产生的
  KEYED_FRAGMENT = 1 << 7, // 具有 key 的动态多平级节点，一般用于 for 循环
  UNKEYED_FRAGMENT = 1 << 8, // 没有key的动态多平级节点
  NEED_PATCH = 1 << 9, // 需要进行 patch 处理的节点
  DYNAMIC_SLOTS = 1 << 10, // 动态插槽
  DEV_ROOT_FRAGMENT = 1 << 11, // 开发模式下的顶级节点
  HOISTED = -1,
  BAIL = -2
}
```

而最后的 `HOISTED` 则代表 **纯静态节点**，即内部的内容始终不会发生改变的节点；**BAIL** 则是用来处理错误异常，一般用来表示跳过或者退出当前处理过程，也表示 diff 结束。

而使用二进制来表示，则是为了 **处理某个节点具有多种属性的情况，通过两者的交集来进行确认**。

例如：

![image-20230420203731074](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230420203731074.png)

其中 3 表示 `TEXT + CLASS = 3`，5 表示 `TEXT + STYLE = 5`。

在更新时，通过 **与运算** 将节点的 **patchFlag** 属性与字典内的选项进行 **与运算**，不等于 0 则表示包含了该设置，需要更新相关的计算结果：

```typescript
const patchElement = (
  n1: VNode,
  n2: VNode,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  isSVG: boolean,
  slotScopeIds: string[] | null,
  optimized: boolean
) => {
  const el = (n2.el = n1.el!)
  let { patchFlag, dynamicChildren, dirs } = n2
  patchFlag |= n1.patchFlag & PatchFlags.FULL_PROPS
  const oldProps = n1.props || EMPTY_OBJ
  const newProps = n2.props || EMPTY_OBJ
  let vnodeHook: VNodeHook | undefined | null

  parentComponent && toggleRecurse(parentComponent, false)
  if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
    invokeVNodeHook(vnodeHook, parentComponent, n2, n1)
  }
  if (dirs) {
    invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate')
  }
  parentComponent && toggleRecurse(parentComponent, true)

  const areChildrenSVG = isSVG && n2.type !== 'foreignObject'
  if (dynamicChildren) {
    patchBlockChildren(n1.dynamicChildren!, dynamicChildren, el, ...)
  } else if (!optimized) {
    patchChildren(n1, n2, el, ...)
  }

  if (patchFlag > 0) {
    // all props
    if (patchFlag & PatchFlags.FULL_PROPS) {
      patchProps( el, n2, oldProps, newProps, ...)
    } else {
      // class
      if (patchFlag & PatchFlags.CLASS) {
        if (oldProps.class !== newProps.class) {
          hostPatchProp(el, 'class', null, newProps.class, isSVG)
        }
      }
      // style
      if (patchFlag & PatchFlags.STYLE) {
        hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG)
      }
      // props
      if (patchFlag & PatchFlags.PROPS) {
        const propsToUpdate = n2.dynamicProps!
        for (let i = 0; i < propsToUpdate.length; i++) {
          const key = propsToUpdate[i]
          const prev = oldProps[key]
          const next = newProps[key]
          if (next !== prev || key === 'value') {
            hostPatchProp(el, key, prev, next, ...)
          }
        }
      }
    }
    // text
    if (patchFlag & PatchFlags.TEXT) {
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children as string)
      }
    }
  } else if (!optimized && dynamicChildren == null) {
    // unoptimized, full diff
    patchProps(el, n2, oldProps, newProps, ...)
  }

  if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
    queuePostRenderEffect(() => {
      vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1)
      dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated')
    }, parentSuspense)
  }
}
```

与运算结果类似以下输出：

```js
console.log(3 & 1) // 1
console.log(3 & 2) // 2
console.log(3 & 4) // 0
console.log(3 & 64) // 0
```

这样，就能快速定位到需要对比计算的属性并完成结果计算。

> 当然，这里只使用到了部分 patchFlags，那么剩下的一部分再哪里呢？让我们接着往下看。

## 2. Block “块”

让我们再观察一下编译后的这个 `setup` 函数，可以看到它的返回值中，第一个值是一个函数操作 `openBlock`。那么这个函数有什么作用呢？

首先，先找到这个函数的位置：`packages\runtime-core\src\vnode.ts`，也就是运行时核心部分中的 VNode 节点处理文件里面，与其相邻的还有一个 `closeBlock` 函数。

```typescript
export const blockStack: (VNode[] | null)[] = []
export let currentBlock: VNode[] | null = null

export function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []))
}

export function closeBlock() {
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
}
```

这里声明了一个常量 `blockStack` 和一个变量 `currentBlock`，通过 **栈** 的形式用来管理所有的 `Block`，保证其正常的嵌套与顺序；并且每个 **Block**，都是一个 VNode 对象。

然后就是通过 `createElementBlock` 来创建一个 **Element** 格式的 “块”。

那么这个 **Block** 具体有哪些类型，分别有什么特殊性呢？

### createElementBlock

```typescript
export let isBlockTreeEnabled = 1

export function createElementBlock(
  type: string | typeof Fragment,
  props?: Record<string, any> | null,
  children?: any,
  patchFlag?: number,
  dynamicProps?: string[],
  shapeFlag?: number
) {
  return setupBlock(
    createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true /* isBlock */)
  )
}
function setupBlock(vnode: VNode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || (EMPTY_ARR as any) : null
  closeBlock()
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode)
  }
  return vnode
}
```

这里就是创建一个 **ElementBlock** 的核心代码，其实最终调用的依然是 `createBaseVNode`，只是设置了一个标志位 `isBlock` 为 `true`。

`setupBlock` 则是为这个块对应的 VNode 设置一个 `dynamicChildren`，用来存放这个块下关联到的 **动态节点**。

> 但是，这个 `dynamicChildren` 默认存放的是 **顺序及个数都确定并且不会改变的动态节点内容**。

例如我们最上面的那段代码，最外层的 **ElementBlock** 在最终得到的就是这四个动态节点，并且会作为 `dynamicChildren` 属性挂载到根节点 Block 的 VNode 对象上：

![image-20230420230951950](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230420230951950.png)

而下面的 **for** 循环则又重新开启了多个 **block**，这是为什么呢？

> 这是因为 **block** 具有 **跨层级** 的特性。

在上面的组件根节点 Block 的 `dynamicChildren` 子节点中，如果不开启子 Block 的话，那么 for 循环中的节点也会直接插入到根节点的 `dynamicChildren` 数组中，如果数组长度发生改变，那么一些节点就可能无法被正常更新（挂载和移除）；`v-if` 等相关指令也会收到类似的影响。

所以遇到 `v-for`、`v-show` 等情况时，都会开启新的 Block，用来确保整体节点的顺序和数量的一致性。

> 侧面反应 Vue 3 的更新粒度也是 Block 级的。

### createBlock

当然，除了 `createElementBlock` 之外，还有一个 `createBlock`，用来创建 **任意类型的 Block**。

```typescript
export function createBlock(
  type: VNodeTypes | ClassComponent,
  props?: Record<string, any> | null,
  children?: any,
  patchFlag?: number,
  dynamicProps?: string[]
): VNode {
  return setupBlock(
    createVNode(type, props, children, patchFlag, dynamicProps, true)
  )
}
```

与 `createElementBlock` 不同的是，它不接受 `shapeFlag` 参数，直接根据 `type` 的类型创建一个 Block。

### Block 树

接着 createElementBlock 那里，最终根节点生成的 Block 是一个包含 4 个 Vnode 的块。

而第四个节点则是一个 **包含了 5 个子节点 VNode 的数组**，结合代码就是与 `v-for` 循环关联的 `p` 标签。也就是这里：

![image-20230421175757421](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230421175757421.png)

在这里 Vue 重新开启一个新的 `ElementBlock` 块，子节点则是由关联的变量 `arr` 遍历产生的新的 `Block Vnode`。

最终就会生成一个由 Block 组成的树形结构：

```
ElementBlock(Fragment)
	- ElementVNode(h1)
	- ElementVNode(input)
	- ElementVNode(h2)
	- ElementBlock(Fragment)
		- ElementBlock(p)
		- ElementBlock(p)
		- ElementBlock(p)
		- ElementBlock(p)
		- ElementBlock(p)
```

## 3. 静态节点提升

所谓 “静态提升”，就是将所有的静态节点进行拆分解析，提取到最外层进行初始化创建 VNode。

例如：

![image-20230421180756089](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230421180756089.png)

其中 `static node 2` 所在的 div 节点，整体都被作为了一个完整的 静态节点被提升为 `_hoisted_2`。

但是与 `static node 3` 关联的 `div` 节点则没有被提升。

也说明 **会被提升为静态节点的内容，自身及子节点均不能包含与变量相关的内容**。

这样以闭包的形式在函数内部一直保留了对静态节点 Vnode 实例的引用，在进行 更新操作时就不需要再次创建 Vnode，并且具有 `patchFlag = -1` 的属性，diff 阶段也会直接跳过这类节点，提升整体性能。

> 这里的 `_hoisted_2` 被作为一个整体，最终还会被进行 **预字符串化** 处理，即转换为 `innerHTML` 的字符串形式。

## 4. 节点内联事件缓存

我们都知道 `v-model:xxx` 其实是 `v-bind:xxx` 与 `v-on:update:xxx` 两者结合后产生的语法糖，其中 `v-bind` 代表的是绑定的 `props` 属性，`v-on` 则代表节点关联的 **事件**。

在上面的例子中，我们添加了一个 `input` 标签，绑定了 `msg` 变量。

那么它就会被解析成具有 `onUpdate:modelValue` 事件绑定的节点：

![image-20230421182045279](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230421182045279.png)

但是它的事件与我们原来想的可能不太一样：

> 即使不使用 `v-model`，完整的写成 `v-bind + v-on` 的形式，那么事件也应该是 `$event => msg.value = $event`，而不会有 `cache` 的存在。

而这个 `cache`，就是 **内联事件缓存对象（数组）**。

![image-20230421182642565](./docs-images/Vue3%20%E7%BC%96%E8%AF%91%E4%BC%98%E5%8C%96/image-20230421182642565.png)



`cache` 数组来自组件实例，在组件实例首次创建解析之后，就会将 **组件模板内所有内联事件** 保存到 `cache` 数组中。

当组件更新创建新的 VNode 对象时，依然使用的是之前缓存的事件对象地址，省去了重新创建事件函数的过程，也避免了重新创建事件导致触发组件更新的情况。



