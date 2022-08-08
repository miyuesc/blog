# IceStark

## 1. 介绍

阿里飞冰团队于 2019 年 6 月发布的微前端框架，内部服务于淘宝、飞猪、钉钉、阿里云等大型项目。

**IceStark** 支持以下特性：

1. 框架无关（也是所有微前端框架都会解决的问题）
2. 快速迁移：支持从 url，html 文本，entry应用入口文件等方式直接接入
3. 完善的 js 沙箱，使微应用接入更安全
4. 性能优秀（大家都优秀）
5. 支持 ES Module
6. 支持微模块（Single SPA 也有）

**IceStark** 本身并不是基于 **Single SPA** 进行二次开发，而是自身内部实现了一套微应用加载逻辑，但是在浏览器历史记录处理（前进与回退等事件需要渲染对应子应用）也借鉴了部分 **Single SPA** 的逻辑；并提供了与 **SingleSPA** 类似的配置 API，兼容 **Single SPA** 微应用。

## 2. 主应用

在 **IceStark** 的官方文档中，对主应用职责进行了说明：

1. 负责整体系统 Layout 布局
2. 注册和配置微应用
3. 避免过多样式代码
4. 减少公共 API 暴露，避免应用耦合

**IceStark** 主应用构建与 **qiankun** 比较相似，都通过 **registerMicroApps** 来注册微应用，通过 **start** 开启路由劫持来加载/卸载微应用。

> 应该是因为官方内部使用 **React** 更多一点，所以对 **React** 的应用注册提供了 **AppRouter** 和 **AppRoute** 来替换原有的 **ReactRouter**，直接注册微应用。
>
> 因为笔者对 **React** 不是很熟悉，大家可以看 [官方文档 - React 主应用接入](https://micro-frontends.ice.work/docs/guide/use-layout/react)

**首先，引入 IceStark**

```bash
npm install @ice/stark --save
```

**然后，创建 micro-apps.ts**

```typescript
import { registerMicroApps, start } from '@ice/stark';
import NProgress from 'nprogress'
import "nprogress/nprogress.css";

const getDivDom:HTMLElement = (id: string) => document.getElementById(id)

// 子应用
const microApps = [
  {
    name: 'sub-app-one',
    entry: '//localhost:3001',
    activeRule: '/sub-one'
  }
]

// 生命周期处理
const lifeCycles = {
  beforeMount: (app: any) => {
    console.log("before mount app.name====>>>>>", app.name)
  },
  afterMount: (app: any) => {
    console.log("after mount app.name====>>>>>", app.name)
  },
  afterUnmount: (app: any) => {
    console.log("after unmount app.name====>>>>>", app.name)
  }
}

// 子应用处理
const normalizeMicroApp = (apps = []) => {
  return apps.map((app: any) => ({
    container: getDivDom('#sub-container'),
    ...app
  }))
}

const register = () => registerMicroApps(normalizeMicroApp(microApps), lifeCycles)
export default {
    register,
    start
}
```

> 这里有以下几点需要注意：
>
> 1. **IceStark** 子应用生命周期与 **qiankun** 等不同，没有 **beforeLoad**，增加了 **beforeUpdate** 和 **afterUpdate**
> 2. 子应用挂载节点配置 **container** 需要是一个 **HTMLElement** 节点，而不是字符串
> 3. 子应用配置没有 **loader** 选项，如果要配置加载过度动画，需要配置到 **start** 方法。

```typescript
// 这里对上面的 start 方法进行一下扩展
const startLoading = () => NProgress.start()
const endLoading = () => NProgress.done()


const startApp = (props: StartConfiguration) => {
  start({
    onAppEnter: startLoading,
    onFinishLoading: endLoading,
    onError: endLoading,
    ...props
  })
}
```

## 3. 子应用

微应用接入与 **qiankun** 和 **Single SPA** 基本一致，都需要子应用打包成 **umd** 格式，在入口处导出声明周期函数，并且都需要给子应用配置基准路由，避免无法匹配。

> **IceStark** 微应用不需要 **bootstrap** 初始化周期

### 3.1 Webpack 应用

使用 **Vue CLI** 和 **CRA（create react app）** 之类的脚手架创建的应用都算是 webpack 应用，这里还是以 **Vue** 作为例子。

**首先，依然是修改 main.ts 入口文件**

```javascript
import Vue from 'vue';
import VueRouter from 'vue-router';
import isInIcestark from '@ice/stark-app/lib/isInIcestark';
import setLibraryName from '@ice/stark-app/lib/setLibraryName';
import App from './App.vue';
import routes from './router';

let router = null;
let instance = null;

function render(props = {}) {
  const { container } = props;
  router = new VueRouter({
    base: window.__POWERED_BY_QIANKUN__ ? '/app-vue/' : '/',
    mode: 'history',
    routes,
  });
  instance = new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount(container || '#app');
}

// 注意：`setLibraryName` 的入参需要与 webpack 工程配置的 output.library 保持一致
setLibraryName('microApp');

export function mount(props) {
  render(props)
}

export function unmount() {
  instance && instance.$destroy();
  instance.$el.innerHTML = '';
  instance = null;
  router = null;
}

if (!isInIcestark()) {
  render()
}
```

> 这里的 **VueRouter** 路由实例可以拆分出来单独实例化。**IceStark** 提供了 **getBasename** 方法用来查询 **setLibraryName** 时定义的微应用基准路由。

```javascript
import Vue from 'vue';
import Router from 'vue-router';
import getBasename from '@ice/stark-app/lib/getBasename';
Vue.use(Router);

export default new Router({
  mode: 'history',
  base: getBasename(),
  routes: [
    // ...
  ],
});
```

**最后，也是修改 webpack 配置**

```javascript
module.exports = {
  output: {
    // 设置模块导出规范为 umd
    libraryTarget: 'umd',
    // 与上文 setLibraryName 设置的名称一致
    library: 'microApp',
  }
}
```

### 3.2 Vite 子应用

> Vite 子应用的应用实例化和路由配置与上面基本一致，这里不再赘述

根据官方文档，这里接入 Vite 子应用有两种方式：

**1. 使用 Vite Lib 模式，指定入口为 main.ts**

```javascript
cimport { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: './src/main.ts',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      preserveEntrySignatures: 'exports-only',
    }
  },
})
```

> 但是这种方式会造成子应用无法单独运行（也可以改造成按照环境变量来设置不同的 lib 配置）

**2. 使用官方插件  [vite-plugin-index-html](https://www.npmjs.com/package/vite-plugin-index-html) **

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import htmlPlugin from 'vite-plugin-index-html';

export default defineConfig({
  plugins: [
    vue(),
   htmlPlugin({
     input: './src/main.ts', // 指定确定的入口文件
     preserveEntrySignatures: "exports-only", // 确保入口文件导出生命周期函数
   })
  ],
})
```

> 🚀 因为 Vite 应用启动时采用的是原生 ES Module，所以主应用在注册时需要声明脚本加载方式：
>
> ```javascript
> registerMicroApps([
>   {
>     name: 'seller',
>     activePath: '/seller',
>     // ...
>     loadScriptMode: 'import', // 指定加载 ES modules 类型微应用
>   }
> ])
> ```

## 4. 样式隔离

> 🚀🚀 样式隔离通常指子应用间的样式隔离，主应用如果没有过分区分的话，有可能会对子应用样式造成影响。

这里的隔离方式推荐以下几种：

1. CSS Module：主应用与子应用都采用该方式，就可以避免主应用样式影响
2. 主应用与微应用避免重复使用样式重置插件，建议提取到主应用即可
3. 对于不同的应用间有不同UI库或者主题配置，建议修改类名前缀

> **不论是 qiankun 还是 IceStark，这类微前端框架通常都能做到 JS 的沙箱隔离，但是对于样式隔离的问题，大家采用的方案一般都是 Shadow DOM，但是 Shadow DOM 并不能解决 Dialog 这类直接插入到 body 节点下的组件样式，并且兼容性也待商榷。所以，采用 CSS Module 并约定一个良好的应用样式规范，才是避免样式冲突最好的方法。**
