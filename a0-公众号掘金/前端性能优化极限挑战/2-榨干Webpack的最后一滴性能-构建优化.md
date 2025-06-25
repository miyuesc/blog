# 榨干 Webpack 的最后一滴性能 - 构建优化

## 引言：当 `webpack build` 成为你摸鱼的理由…

各位前端“建筑师”们，大家好！

在我们的日常工作中，`webpack` 就像一位勤勤恳恳的建筑工头，它将我们散落各处的 `JavaScript` 模块、`CSS` 样式、图片资源等“建筑材料”，井然有序地打包、压缩、转换，最终建成一座座宏伟的“代码大厦”。

然而，随着项目这座“大厦”越盖越高，我们的“工头”似乎也开始变得力不从心。你是否也经历过这样的场景：

*   **场景一：** 你只是改了一行 `console.log`，然后敲下 `npm run dev`，结果去泡了杯咖啡、回了条微信，回来发现编译还没完成，命令行依然在不知疲倦地转着圈圈。
*   **场景二：** 项目终于要上线了，你庄重地敲下 `npm run build`，然后……然后你就可以开始带薪刷B站了。半小时后，打包终于结束，你看着那几十兆甚至上百兆的 `dist` 目录，陷入了沉思。

缓慢的构建速度不仅消耗着我们的耐心，更直接扼杀了我们的开发效率。而臃肿的产物体积，则像一个无形的枷锁，拖慢了用户的加载速度，蚕食着我们在上一篇文章中辛苦优化的 FCP 成果。

是时候给我们的“工头”减负增效了！这篇“战斗檄文”，我们将化身“性能优化工程师”，深入 `Webpack` 的心脏地带，从**构建速度**和**产物体积**两大核心战场入手，祭出一系列“黑科技”和实战技巧，榨干 `Webpack` 的最后一滴性能！

准备好了吗？让我们一起，让 `webpack build` 不再是你摸鱼的借口，而是你展示技术实力的舞台！

---

## 第一章：让“风火轮”转得快一些——构建速度优化

时间就是金钱，我的朋友！在开发阶段，每一秒的等待都是对生产力的谋杀。构建速度的优化，目标就是让开发服务器的启动和热更新快如闪电，让生产环境的打包过程干净利落。

### 利器先行：用数据“揪出”性能瓶颈

优化不能凭感觉，我们得先找到谁是“拖后腿”的那个。这里推荐两个“侦察兵”插件：

1.  **`speed-measure-webpack-plugin`**: 这个插件能精确测量出 `Webpack` 在构建过程中，各个 `Loader` 和 `Plugin` 的执行耗时。谁是“慢吞吞先生”，一目了然。

    ```bash
    npm install --save-dev speed-measure-webpack-plugin
    ```

    在 `webpack.config.js` 中使用它：

    ```javascript
    const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
    const smp = new SpeedMeasurePlugin();

    // 用 smp.wrap() 包裹你的 webpack 配置
    module.exports = smp.wrap({
      // ... 你的 webpack 配置
    });
    ```

    运行构建后，你会在控制台看到一份详细的“耗时报告”。

2.  **`webpack-bundle-analyzer`**: 这个我们后面还会提到，它能生成一个可视化的打包分析报告，让你直观地看到各个模块在最终产物中的体积占比。虽然它主要用于体积分析，但也能帮助我们发现一些不合理的打包策略，从而间接影响构建速度。

### 提速“三板斧”：缓存、多进程与缩小范围

#### 1. 开启持久化缓存 (The Ultimate Weapon)

`Webpack 5` 带来的最重磅的性能优化特性，莫过于**持久化缓存**。它能将首次构建的结果（比如模块的编译结果、AST等）缓存到文件系统中。当你再次构建时，`Webpack` 会智能地跳过那些没有发生变化的文件，直接使用缓存，从而实现“秒级”启动！

开启它非常简单：

```javascript
// webpack.config.js
module.exports = {
  // ...
  cache: {
    type: 'filesystem', // 使用文件系统缓存
    buildDependencies: {
      // 当配置文件或 node_modules 发生变化时，缓存失效
      config: [__filename],
    },
  },
};
```

这绝对是 `Webpack 5` 中性价比最高的优化，没有之一。它能将二次构建的速度提升一个数量级。

#### 2. 多进程打包：人多力量大

运行在 `Node.js` 之上的 `Webpack` 本质上是单线程的。当文件数量众多，特别是需要 `babel-loader`、`ts-loader` 这类“重型” `Loader` 来处理时，单线程就会成为瓶颈。

`thread-loader` 就是来解决这个问题的。它会将后续的 `Loader` 放置在一个单独的 `worker` 池中运行，实现多进程并行处理。

```bash
npm install --save-dev thread-loader
```

```javascript
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'thread-loader', // 将此 loader 放置在其他 loader 之前
          'babel-loader'
        ],
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
};
```

**注意**： 启动和维护进程本身是有开销的（官方说大约 600ms）。因此，对于一些小型项目或者轻量级的 `Loader`，使用多进程反而可能会变慢。一定要用 `speed-measure-webpack-plugin` 测试后再决定是否使用。

#### 3. 缩小构建目标：只做“分内之事”

`Webpack` 在构建时，会从入口文件开始，递归地解析所有依赖。我们应该明确地告诉它，哪些文件需要处理，哪些文件可以忽略，避免不必要的工作。

*   **`resolve.modules`**: 告诉 `Webpack` 解析模块时应该搜索的目录。默认是 `['node_modules']`。我们可以把它配置为 `[path.resolve(__dirname, 'src'), 'node_modules']`，让它优先在我们的源码目录中查找，减少搜索层级。

*   **`resolve.extensions`**: 指定解析模块时自动尝试的文件扩展名。列表越长，尝试次数就越多。我们应该只保留项目中实际用到的扩展名，并把最常用的放在前面，比如 `['.js', '.vue', '.json']`。

*   **`include` 和 `exclude`**: 在 `Loader` 配置中，这是至关重要的一步。使用 `include` 明确指定 `Loader` 的作用范围，或者使用 `exclude` 排除掉不需要处理的目录，特别是 `node_modules`！

    ```javascript
    // webpack.config.js
    module.exports = {
      // ...
      module: {
        rules: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            // 只对 src 目录下的 js 文件进行 babel-loader 处理
            include: path.resolve(__dirname, 'src'),
            // 排除 node_modules 目录
            // exclude: /node_modules/  (include 和 exclude 一般二选一即可)
          },
        ],
      },
    };
    ```

*   **`noParse`**: 如果你确定某个库（比如 `jQuery`、`lodash`）是独立的，没有其他依赖，并且是已经构建好的，你可以告诉 `Webpack` 不用去解析它，直接打包进去。这能节省大量的解析时间。

    ```javascript
    // webpack.config.js
    module.exports = {
      // ...
      module: {
        noParse: /jquery|lodash/,
      },
    };
    ```

---

## 第二章：给 `dist` 目录“减负”——产物体积优化

构建速度上去了，开发体验爽了。但如果打包出来的文件依然是个“庞然大物”，那用户的体验就爽不起来了。产物体积优化，是我们在生产环境中必须打赢的硬仗。

### “火眼金睛”：`webpack-bundle-analyzer`

再次请出我们的神器 `webpack-bundle-analyzer`。它能生成一个交互式的树状图，让你清晰地看到：

*   最终的 `bundle` 由哪些模块组成。
*   每个模块的体积占比是多少。
*   哪些第三方库是“体积大户”。
*   有没有重复打包的模块。

```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
// webpack.prod.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  // ...
  plugins: [
    new BundleAnalyzerPlugin() // 默认会在浏览器自动打开分析报告
  ]
};
```

有了这份“地图”，我们就能精准地找到需要“减负”的目标。

### 体积优化“组合拳”

#### 1. `Tree Shaking`：摇掉“死代码”

`Tree Shaking`（摇树）是 `Webpack` 中一个非常重要的优化。它的作用是，在打包时自动移除掉那些你引入了但**从未使用**的 `JavaScript` 代码（所谓的“死代码”）。

要让 `Tree Shaking` 生效，需要满足两个条件：

1.  **必须使用 ES6 模块语法 (`import` 和 `export`)**。因为 `Tree Shaking` 依赖于 ES6 模块的静态分析能力。
2.  在 `package.json` 中配置 `sideEffects` 字段，告诉 `Webpack` 哪些文件是有“副作用”的，不应该被 `Tree Shaking`。副作用是指，一个模块在被 `import` 时，会执行一些对外部环境有影响的代码，比如 `polyfill`，或者向 `window` 对象添加属性，或者某些 `CSS` 文件（`import './style.css'`）。

    ```json
    // package.json
    {
      "name": "my-awesome-project",
      "sideEffects": false // 告诉 webpack，我这个项目所有模块都没有副作用
    }
    ```

    或者，更精细地控制：

    ```json
    // package.json
    {
      "name": "my-awesome-project",
      "sideEffects": [
        "./src/polyfills.js",
        "*.css" // 所有 CSS 文件都有副作用
      ]
    }
    ```

在 `production` 模式下，`Webpack` 默认会开启 `Tree Shaking`。

#### 2. 代码压缩：`Terser` 的“魔法”

`Webpack` 在生产模式下，会默认使用 `TerserWebpackPlugin` 来压缩 `JavaScript` 代码。它会做很多事情，比如：

*   移除空格、注释
*   缩短变量名
*   移除 `console.log`、`debugger`
*   进行更复杂的代码转换，比如 `if (false) { ... }` 会被直接移除。

通常我们不需要额外配置，但如果你想自定义压缩选项，可以这样做：

```javascript
// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  // ...
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
          },
        },
        extractComments: false, // 不将注释提取到单独的文件
      }),
    ],
  },
};
```

对于 `CSS`，可以使用 `CssMinimizerWebpackPlugin` 来进行压缩。

#### 3. 公共依赖提取：`SplitChunks`

在多页应用或者有代码分割的单页应用中，不同的 `chunk`（代码块）可能会依赖同一个第三方库，比如 `React`、`Vue`、`lodash`。如果不做处理，这个库就会被打包进每一个依赖它的 `chunk` 中，造成巨大的体积浪费。

`optimization.splitChunks` 就是来解决这个问题的。`Webpack 5` 的默认配置已经非常智能，它会自动将 `node_modules` 中的模块和被多次引用的模块提取到一个或多个单独的文件中（通常叫 `vendors.js`）。

你可以通过自定义配置来实现更精细的拆分策略，比如将 `React` 相关的库打包成一个文件，将 `UI` 库打包成另一个文件。

```javascript
// webpack.prod.js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: 'all', // 对所有 chunk 进行优化
      cacheGroups: { // 自定义缓存组
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'vendor-react',
          priority: 10, // 优先级更高
        },
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 5,
        },
      },
    },
  },
};
```

#### 4. 善用 `externals` 和 CDN

对于一些非常稳定且体积巨大的第三方库，比如 `Vue`、`React`、`ElementUI`，我们还有一个终极武器：**不打包它们**！

我们可以通过 `externals` 配置，告诉 `Webpack`：“这些库我会在 `HTML` 文件里通过 `<script>` 标签从 CDN 引入，你打包的时候就别管它们了，直接把它们当作外部依赖处理就行。”

```javascript
// webpack.prod.js
module.exports = {
  // ...
  externals: {
    'vue': 'Vue',
    'react': 'React',
    'react-dom': 'ReactDOM',
    'element-ui': 'ELEMENT',
  },
};
```

然后在 `public/index.html` 中引入它们：

```html
<!-- public/index.html -->
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js"></script>
<script src="https://unpkg.com/element-ui/lib/index.js"></script>
```

这样做的好处是：

*   极大地减小了我们自己的 `bundle` 体积。
*   用户可能在访问其他网站时已经加载过这些 CDN 上的库，可以直接利用浏览器缓存，实现“秒开”。

当然，缺点是强依赖于 CDN 的稳定性。

---

## 总结：成为一名“斤斤计较”的性能大师

`Webpack` 的优化是一个系统性工程，它要求我们像一位精打细算的“管家”，对每一份资源的构建耗时和最终体积都“斤斤计V较”。

我们再来梳理一下今天的“武功秘籍”：

*   **速度优化**：
    *   **侦察兵**：使用 `speed-measure-webpack-plugin` 定位瓶颈。
    *   **杀手锏**：开启 `Webpack 5` 的**持久化缓存**。
    *   **人海战术**：使用 `thread-loader` **多进程打包**处理重型 `Loader`。
    *   **精准打击**：通过 `include/exclude`、`resolve` 等配置**缩小构建范围**。

*   **体积优化**：
    *   **火眼金睛**：使用 `webpack-bundle-analyzer` 分析产物体积。
    *   **摇一摇**：配置 `sideEffects`，让 **`Tree Shaking`** 发挥最大威力。
    *   **压一压**：利用 `Terser` 和 `CssMinimizer` **压缩代码**。
    *   **分一分**：通过 `SplitChunks` **提取公共依赖**。
    *   **甩出去**：利用 `externals` 和 **CDN** 处理大型第三方库。

性能优化没有银弹，它需要在不同的项目场景中不断地分析、尝试和权衡。希望今天的分享能为你提供一份清晰的“作战地图”。现在，就去审视你的 `Webpack` 配置，开始这场激动人心的“瘦身”和“提速”之旅吧！

在下一篇文章中，我们将探讨浏览器渲染的奥秘，学习如何利用 `GPU` 加速，让你的动画如丝般顺滑。我们下期再见！

---

### 参考资料

*   [玩转 webpack，使你的打包速度提升 90% - 掘金](https://juejin.cn/post/6844904071736852487)
*   [【Webpack】如何做打包优化，才能有效减少包体积 - CSDN博客](https://blog.csdn.net/mayuhao0000/article/details/143991216)
*   [Webpack 优化指南：如何让你的构建速度飞起来 - CSDN博客](https://blog.csdn.net/mmc123125/article/details/144281668)
*   [webpack优化解决项目体积大、打包时间长、刷新时间长问题！-腾讯云开发者社区](https://cloud.tencent.com/developer/article/1643104)
*   [学习 Webpack5 之路（优化篇） - JELLY](https://jelly.jd.com/article/61179aa26bea510187770aa3)