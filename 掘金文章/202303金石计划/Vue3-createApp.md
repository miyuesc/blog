# 从 CreateApp 开始学习 Vue 源码

## 前言

大家好，我是 Miyue，人称“小米”（不是那个小米）~

从 Vue 3 在 2020 年 9 月发布到现在，也已经两年半的时间了，期间经过大大小小的优化和迭代，目前 Vue 3 已经快成为 Vue 新项目的首选版本，Vue 2 也即将停止维护，所以现在写 Vue 2 的文章也已经不再吃香了。好在，现在开始学习 Vue 3 也不算晚。

在之前的 [Vue2与Vue3响应式原理与依赖收集详解](https://juejin.cn/post/7202454684657107005) 等相关的几篇文章里，大致解析了 Vue 3 中对 **数据响应式** 的 `Proxy` 实现，以及 `Effect` 副作用和依赖收集。但是直接分析每一部分的实现原理或者运行逻辑，总是会缺乏对系统整体的认知，所以现在决定从Vue项目的第一步开始。

## 从项目开始

前面跟随  [川哥（若川）](https://juejin.cn/user/1415826704971918) 的脚步，写了一篇 create-vite 这个脚手架的实现原理，现在我们就通过这个脚手架创建一个简易的 Vue + TS 的项目吧。

```bash
pnpm create vite my-vue-app -- --template vue-ts
```

此时我们可以得到这样一个项目：

![image-20230320163406020](./docs-images/Vue3-createApp/image-20230320163406020.png)

根据 Vue 2 项目的经验，我们可以很快的找到项目的真实入口：`src/main.ts`。

进入到该文件，最初只有以下代码：

```typescript
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
```

结合 Vue 2 的开发习惯，其中的 `#app` 肯定就是 `html` 页面上的一个元素 id；所以这部分逻辑为：

- 引入 `createApp`
- 引入基础样式 `style.css`
- 引入入口单文件组件 `App.vue`
- 调用 `createApp` 传入引用组件 `App.vue` 并执行 `mount` 挂载到 `#app` 元素上

可见，**`createApp` 是一个接收 Vue 组件并返回一个具有 `mount` 方法的对象**。

## 进入 createApp

通过 Ctrl 加左键，可以很快的进入到 Vue 中 `createApp` 对应的类型声明文件中，此时我们可以留意一下这个声明文件对应的目录是 `@vue/runtime-dom/dist/runtime-dom.d.ts`，由目录也可以看出这个声明文件是自动生成的，所以如果要查看源码的话，还是得去官方仓库查看原始代码。

根据打包后的路径，可以直接进入 Vue 3 仓库下的 `runtime-dom` 包来查找对应的方法（当然这种方式只是我个人喜好，川哥其实推荐从官方仓库的  `README.md` 和 `contributing.md` 贡献指南文档 来查找项目入口和测试方案等），一般来说会直接导出的方法都可以在 `index.ts` 中找到。

幸运的是确实能在 `core/packages/runtime-dom/src/index.ts` 中找到这个方法 [手动狗头~~]

> 一般来说，肯多开源项目使用 `monorepo` 的方式进行开发的话，各个模块一般都会在 **根目录下的 `packages` 中按照不同的模块名创建不同的子项目**。

`createApp` 源码如下：

```typescript
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)
  
  const { mount } = app
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) return

    const component = app._component
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML
    }

    container.innerHTML = ''
    const proxy = mount(container, false, container instanceof SVGElement)
    if (container instanceof Element) {
      container.removeAttribute('v-cloak')
      container.setAttribute('data-v-app', '')
    }
    return proxy
  }

  return app
}) as CreateAppFunction<Element>
```

可以发现这部分只是对  `ensureRenderer().createApp(...args)` 返回的 `app` 实例的 `mount` 方法进行了一次重写，**增加了对传入参数的校验（是否能找到指定元素）和元素清空的方法**。其核心依然是 `ensureRenderer` 方法和它返回值的 `createApp` 方法。

进入 `ensureRenderer` 方法，发现他也只是调用了 `createRenderer`。

## createRenderer 创建渲染器

顾名思义，这个方法就是创建一个用来渲染的 `renderer` 渲染器实例。

在 `ensureRenderer` 方法中，其实是通过 **模块** 的方式，确保了 `renderer` 实例的 **存在性和唯一性** ，个人认为这种方式也可以看做是闭包或者单例模式。

```typescript
const rendererOptions = /*#__PURE__*/ extend({ patchProp }, nodeOps)
let renderer: Renderer<Element | ShadowRoot> | HydrationRenderer
function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
  )
}
```

这种情况下，即使多次调用 `ensureRenderer` 方法，返回的 `renderer` 实例始终是同一个。

那么话不多说，进入正题吧~

**首先，`createRenderer ` 接收一个 `rendererOptions` 参数并返回一个 `Renderer | HydrationRenderer` 类型的实例**。

这个 `rendererOptions`，是 `nodeOps` 和 `patchOps`两个对象的合集，包含了 `insertBefore、remove(removeChild)、createElement` 等 `Dom` 操作方法，以及 `patchProp` 节点属性对比方法。

而这里的 `createRenderer` 方法位于 `packages\runtime-core\src\renderer.ts` 中，通过 `baseCreateRenderer` 来创建渲染器。

## baseCreateRenderer

整个 `baseCreateRenderer` 方法的实现部分差不多有两千行，除了创建渲染器的逻辑之外，还 **定义了一系列与更新和渲染相关的方法，其中就包括我们的 `diff` 算法，也就是 `patch` 函数**。不过目前我们的主要目的是研究 Vue 项目的初始化，这里先省略 `patch` 相关的部分。

我们先找到这个返回的 `return` 部分，它返回了一个包含 `render、hydrate` 两个属性，以及一个由 `createAppAPI(render, hydrate)` 返回的 **方法** `createApp`。

然后返回正文查看 `render` 和 `hydrate` 属性的定义：

```typescript
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions
): any {
	const render: RootRenderFunction = (vnode, container, isSVG) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true)
      }
    } else {
      patch(container._vnode || null, vnode, container, null, null, null, isSVG)
    }
    flushPreFlushCbs()
    flushPostFlushCbs()
    container._vnode = vnode
  }

  const internals: RendererInternals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  }

  let hydrate: ReturnType<typeof createHydrationFunctions>[0] | undefined
                          
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate)
  }
}
```

当然，由于我们此时 **不是服务端渲染**，所以 `createHydrationFns` 参数没有值，`hydrate` 是 `undefined`；而 `render` 作为渲染方法，主要负责更新和卸载。