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
	<micro-app name='home' url='http://localhost:3001/micro-app/home' heep-alive />
</template>
<script lang="ts" setup></script>
```

```vue
// about.vue
<template>
	<micro-app name='about' url='http://localhost:3002/micro-app/about' heep-alive />
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

### 2.3 主应用插件系统

**MicroApp** 在主应用启动（调用 **microApp.start()**）时可以在参数中配置应用插件 **plugins**，并且插件分为 “全局插件 global“ 与 ”子应用插件 modules“。

> **插件系统的主要作用就是对js进行修改，每一个js文件都会经过插件系统，我们可以对这些js进行拦截和处理，它通常用于修复js中的错误或向子应用注入一些全局变量**

> 一个插件接收以下配置项：
>
> 1. scopeProperties：可选配置，接收 string数组，配置 **强隔离的子应用独享全局变量**
> 2. escapeProperties：可选配置，接收 string数组，效果与 scopeProperties 相反，配置 **子应用共享到基座应用和window的全局变量**
> 3. options：可选配置，接收一个任意类型数据，传递给 loader 配置的函数使用
> 4. loader：必须配置，接收一个函数，函数参数为 **code, url, options**，并且必须将 code 返回

插件配置方式如下：

```javascript
import microApp from '@micro-zoe/micro-app'
import painfulJoya from '@micro-zoe/plugin-painful-joya' // 官方封装的子午线埋点插件

microApp.start({
  plugins: {
    // 设置为全局插件，作用于所有子应用
    global: [painfulJoya],
    // 设置 home 子应用的独享配置
    home: [{
      scopeProperties: ['AMap'],
      loader(code, url) {
        console.log('我是插件loder函数', code, url)
        return code
      }
    }],
  }
})
```

## 3. 子应用

**MicroApp** 官方在子应用的处理上提供了两种模式：默认模式 和 UMD 模式。

- 默认模式：该模式不需要修改子应用入口，但是在切换时会按顺序依次执行 **所有渲染依赖** 的js文件，保证每次渲染的效果是一致的
- UMD 模式：这个模式需要子应用暴露 **mount** 和 **unmount** 方法，只需要首次渲染加载所有 js 文件，后续只执行 mount 渲染 和 unmount 卸载

> 官方建议频繁切换的应用使用 UMD 模式配置子应用

### 3.1 Webpack + Vue 子应用

**1. webpack 配置**

与所有的微前端框架接入子应用一样，首先一样要修改 webpack 的 devServer 配置，来开启跨域请求。

```javascript
module.exports = {
  devServer: {
    disableHostCheck: true, // 关闭端口检测
    port: 4001,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  configureWebpack: {
    output: {
      jsonpFunction: `webpackJsonp-chile-vue2`
    }
  },
}
```

**2. 设置 PublicPath**

> 这里可以新建一个 **public-path.js** 的文件，之后在入口处第一行引入

```javascript
// __MICRO_APP_ENVIRONMENT__和__MICRO_APP_PUBLIC_PATH__是由micro-app注入的全局变量
if (window.__MICRO_APP_ENVIRONMENT__) {
  // eslint-disable-next-line
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__
}
// 之后，在 main.js 中引入
```

**3. 入口文件配置**

上文说到了子应用有两种配置方式，主要就体现在入口文件上。

> 因为路由配置有特殊性，这里先不引用路由，依然是以 Vue 为例

```javascript
import './public-path'
import Vue from 'vue'
import App from './App.vue'

let app = null

////////// 1. 首先是默认模式的配置
app = new Vue({
  router,
  render: h => h(App),
}).$mount('#app')

// 监听卸载，因为每次都会重新加载所有js，所以建议配置一个卸载方法去清空依赖项等
window.unmount = () => {
  app.$destroy()
  app.$el.innerHTML = ''
  app = null
  console.log('微应用vue2卸载了 -- 默认模式')
}

////////// 2. umd 加载模式
// 初始化与二次加载时调用
window.mount = () => {
  app = new Vue({
    router,
    render: h => h(App),
  }).$mount('#app')
  console.log("微应用vue2渲染了 -- UMD模式")
}
// 卸载操作放入 unmount 函数
window.unmount = () => {
  app.$destroy()
  app.$el.innerHTML = ''
  app = null
  console.log("微应用vue2卸载了 -- UMD模式")
}
// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
```

**4. 路由**

这里是子应用路由的简单示例

```javascript
import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history', // hash 模式可以不用配置 base
  //  __MICRO_APP_BASE_ROUTE__ 为micro-app传入的基础路由
  base: window.__MICRO_APP_BASE_ROUTE__ || process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/home.vue'),
    },
    {
      path: '/page',
      name: 'page',
      component: () => import( './pages/page2.vue')
    }
  ];
})
export default router;
```

### 3.2 Webpack + React 子应用

**1. 依旧是修改 webpack 配置，开启跨域访问**

**2. 配置 PublicPath 和入口文件**（public-path.js 配置与上面一致）

> 这里也区分 默认模式 和 umd 模式，默认模式就是将 mount 函数提出来直接运行即可，这里省略

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Router from './router';

window.mount = () => {
  ReactDOM.render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>,
    document.getElementById('root')
  );
}

// 卸载
window.unmount = () => {
  notification.destroy()
  ReactDOM.unmountComponentAtNode(document.getElementById('root'));
}

if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
```

**3. 配置子应用路由**

React 的子应用路由配置其实与 Vue 的类似，只是需要配合 ReactRouter 和 jsx 的写法。

```jsx
import React, { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Switch, Route, Redirect, Link } from 'react-router-dom'

function Router () {
  <BrowserRouter basename={window.__MICRO_APP_BASE_ROUTE__ || '/micro-app/react16/'} >
    <Menu mode="horizontal">
      <Menu.Item key='home'>
        <Link to='/'>home</Link>
      </Menu.Item>
      <Menu.Item key='page'>
        <Link to='/page'>page</Link>
      </Menu.Item>
    </Menu>
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/page">
        <Page />
      </Route>
      <Redirect to='/' />
    </Switch>
  </BrowserRouter>
}
export default Router
```

## 4. 应用路由配置说明

>  基础规则：
>
> 1. 主应用是 **hash路由**，子应用也 **必须** 是hash路由
> 2. 主应用是 **history路由**，子应用则不受影响

### 4.1 主应用路由

主应用路由仅控制主应用的页面渲染，与一般单页应用的路由匹配和渲染逻辑一致。

### 4.2 子应用路由

> 🚀🚀🚀 主应用使用子应用时，配置的 url 与 baseroute、子应用路由 之间 **没有任何关系**！
>
> 子应用与主应用一样是通过 **完整的地址栏路由Path（端口号后面的部分）** 来进行匹配和渲染的，url 属性仅用于加载子应用 html 文件。
>
> **baseroute** 属性是用来给子组件使用，以供配置基础路由前缀的，子应用可以通过 `window.__MICRO_APP_BASE_ROUTE__` 访问到该属性；并且，子应用使用 **hash路由** 模式时也 **不需要配置 baseroute**

根据官方的示例，可以总结以下规则：

> 1. url 与路由配置无关，仅作为子应用 html 文件加载地址
> 2. 主应用与子应用 **共享** 地址栏完整的 **path路径**，但优先级不同：主应用匹配完成之后加载主应用页面，页面中有子应用才渲染子应用并开始子应用路由匹配
> 3. 仅当主应用子应用 **都使用 history 路由模式**，且子应用独立运行时 **不需要特定模块前缀** 的情况下，主应用使用子应用时需要配置 **baseroute** 声明模块前缀；并且子应用路由需要配置 base 属性。

