# MicroApp

## 1. 介绍

**MicroApp** 是“京东零售”团队在2021年7月正式发布的一个微前端框架，并且抛弃了 **Single SPA** 的实现理念，基于 **CustomElement** 和 **ShadowDom** 来实现。

**MicroAPP** 宣传的优势有以下几点：

> 1. 应用接入便捷：主应用只需一行代码即可接入一个微应用（有点夸张哈）
> 2. 零依赖：本身 MicroApp 并不依赖其他第三方库
> 3. 框架兼容：本身对其他框架应用都做了适配，并且也兼容 Vite 和 Webpack 应用
> 4. 其他基本功能：微前端框架都要实现的功能，比如js沙箱、样式隔离、数据通信等

但是因为 **MicroApp** 依赖 **CustomElement** 和 **proxy**，所以浏览器兼容性需要考虑。不过除了已逝的IE，其他浏览器基本都支持。

> 当然了，因为 **MicroApp** 发布比较晚，目前也还在 v1 的 **alpha** 版本，讨论组里面也经常有反馈bug，所以直接上正式项目还有待考虑。

## 2. 主应用

### 2.1 路由配置和基础页面

因为 **MicroApp** 没什么侵入性，所以直接创建用 Vite 创建一个模板项目即可。

```bash
npm create vite@latest main-app -- --template vue-ts
```

> 📌**But：** 因为 **MicroApp** 使用的是 CustomElement，使用的时候与普通 dom 元素一致，在主应用配置路由时最好使用一个空白组件来放置子应用

**这样，先创建一个简单的路由配置和对应页面**

```typescript
// router.ts
import { createRouter, createWebHistory } from "vue-router";
const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home/:page*', name: 'home app', component: () => import('@/views/home.vue') },
  { path: '/about/:page*', name: 'about app', component: () => import('@/views/about.vue') },
]
const router = createRouter({
  history: createWebHistory('/'),
  routes: routes,
})
export default router;
```

```vue
// home.vue
<template>
	<micro-app name='home' url='http://localhost:3001/micro-app/home' base-route='/sub-app' heep-alive />
</template>
<script lang="ts" setup></script>
```

```vue
// about.vue
<template>
	<micro-app name='about' url='http://localhost:3002/micro-app/about' base-route='/sub-app' heep-alive />
</template>
<script lang="ts" setup></script>
```

> 🚀 Vue 的路由配置这里需要注意一点：
>
> 因为子应用后面通常会有自己的路由，并且不确定是 history 模式还是 hash 模式，所以主应用在配置 path 地址匹配时需要配置 **非严格匹配**，避免跳转空白页面。

### 2.2 全局生命周期配置

MicroApp 在主应用注册的时候可以注册全局的生命周期监听函数。

```typescript
// main.ts
import microApp from '@micro-zoe/micro-app'

const lifeCycles = {
  created() {
    console.log('标签初始化后，加载资源前触发')
  },
  beforemount() {
    console.log('加载资源完成后，开始渲染之前触发')
  },
  mounted() {
    console.log('子应用渲染结束后触发')
  },
  unmount() {
    console.log('子应用卸载时触发')
  },
  error() {
    console.log('子应用渲染出错时触发，只有会导致渲染终止的错误才会触发此生命周期')
  }
}

microApp.start({ lifeCycles })
```

