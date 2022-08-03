# qiankun

## 1. 介绍

**qiankun** 是蚂蚁金服基于 **Single SPA** 开发的一个微前端实现库，简化了微应用的注册方式，增加了微应用的沙箱管理(js、css隔离)与全局状态共享机制，并且 qiankun 内部实现了一个解析 **html** 字符串获取静态资源地址的解析库 [import-html-entry](https://github.com/kuitos/import-html-entry)，方便微应用接入与资源预加载。

虽然 **qiankun** 是基于 **Single SPA** 开发的，但是两者对项目的推荐架构有些许区别（个人理解，请轻喷）：

1. **Single SPA** 推荐 **动态模块加载** 的方式来搭建微前端架构，主应用作为一个纯净的“加载器”，仅提供一个基础 HTML 页面，配合 **SystemJS** 的 **importMap** 特性来加载微应用，所有微应用的注册以及版本管理通过 **import-map.json** 文件来控制。
2. **qiankun** 则依然推荐创建一个主应用（即使这个主应用只有一个 html 文件）来注册微应用并启动整个应用，依然需要在主应用中配置 **registerMicroApps** 和 **start** 方法。

> 虽然两者推荐的项目构建方式有些许区别，但是核心逻辑其实都是在主应用中通过引入 js 的方式来加载微应用。只是使用 **Single SPA** 来进行项目改造时，不仅需要在每个应用入口文件里面导出声明周期，还需要修改各自的路由配置、webpack打包配置等等；并且 **Single SPA** 也没有实现应用隔离、数据通信等功能，所以建议还是使用 **qiankun** 作为微前端框架选型。

## 2. 上手

> 这里可以根据 [qiankun / 项目实践](https://qiankun.umijs.org/zh/guide/tutorial) 的文档来使用

### 2.1 主应用

按照 **qiankun** 官方文档的说明，主应用主要用于提供一个 html 入口页面，以及注册微应用和启动项目。但是因为 **qiankun** 不支持 CDN 的方式引入，所以还是需要新建一个主应用工程。该工程包含一个 **index.html** 和一个 **index.js**，当然也需要 **package.json** 和 **webpack** 配置。

##### 创建 index.html

这个文件主要是用来提供一个 DOM 节点挂载微应用

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>QianKun Example</title>
</head>
<body>
    <div class="main-app">
        <!-- 导航菜单  -->
        <ul class="main-app_side-menu">
            <li onclick="push('/vue')">Vue</li>
            <li onclick="push('/vue3')">Vue3</li>
        </ul>
        <!-- 子应用  -->
        <main id="sub-app_container"></main>
    </div>
    <script>
        // 应用切换
        function push(subapp) {
            history.pushState(null, subapp, subapp)
        }
    </script>
</body>
</html>
```

##### 安装 qiankun 并配置微应用

首先，安装 **qiankun** 依赖

```shell
npm install qiankun
```

之后在 **index.js** 中注册两个微应用

```javascript
import { registerMicroApps, start } from 'qiankun';
// 注册微应用
registerMicroApps(
    [
        {
            name: 'vue',
            entry: '//localhost:3001',
            container: '#sub-app_container',
            loader,
            activeRule: '/vue',
        },
        {
            name: 'vue3',
            entry: '//localhost:3002',
            container: '#sub-app_container',
            loader,
            activeRule: '/vue3',
        },
    ],
    {
        beforeLoad: [
            (app) => console.log('[LifeCycle] before load %c%s', 'color: green;', app.name),
        ],
        beforeMount: [
            (app) => console.log('[LifeCycle] before mount %c%s', 'color: green;', app.name),
        ],
        afterUnmount: [
            (app) => console.log('[LifeCycle] after unmount %c%s', 'color: green;', app.name),
        ],
    },
);
// 启动
start()
```

当然，这里还需要配置 **webpack server** 和对应的 **loader**

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: './index.js',
  devServer: {
    open: true,
    port: '3000',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  resolve: { extensions: ['.js'] },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
  ],
};
```

这样我们就算创建了一个基础的 **qiankun** 主应用了。

但是这个模板依然有很多缺陷，比如没有默认子应用、没有应用切换状态管理、没有状态数据等。所以一般推荐直接使用 **Vue** 或者 **React** 提供的脚手架直接创建一个新项目，再对其进行改造。