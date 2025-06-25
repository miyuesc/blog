# 告别白屏！首屏加载（FCP）优化实战

## 引言：当用户在你的网站上看到“一片空白”时，他们心里在想什么？

嘿，各位驰骋在代码世界的骑士们！想象一个场景：你精心打造的网站终于上线，你激动地把链接发给朋友、发到用户群，期待着如潮的好评。然而，你收到的第一条反馈却是：“你这网站咋打不开啊，一直白屏？”

“打不开”？“白屏”？这两个词像两把利剑，瞬间刺穿了你作为前端工程师的骄傲。你赶紧打开网站，发现它只是加载得慢了一点点……好吧，是慢了亿点点。在那几秒钟的白屏时间里，用户可能已经经历了从“满怀期待”到“有点不耐烦”再到“这啥破玩意儿，关了！”的心路历程。

在这个“快”字当头的时代，用户的耐心比金子还珍贵。Google 的研究表明，页面加载时间从1秒增加到3秒，用户跳出的概率会增加32%。白屏，就是扼杀用户兴趣和业务转化率的头号杀手。它就像一场糟糕的初次约会，还没等你说上话，对方就已经把你拉黑了。

那么，作为追求极致用户体验的前端开发者，我们该如何向这该死的“白屏”宣战呢？答案就藏在一个关键的性能指标里——**FCP（First Contentful Paint，首次内容绘制）**。

这篇“檄文”，我们将一起深入探讨 FCP 的奥秘，并祭出三大“法宝”——资源优化、传输优化，以及一系列实战代码，让你彻底告别白屏，让你的网站快到飞起，让用户体验如丝般顺滑！准备好了吗？让我们一起踏上这场“前端性能优化极限挑战”之旅吧！

---

## 第一章：性能指标大揭秘：FCP、LCP、TTI，到底该听谁的？

在开始优化之前，我们得先学会“看病”。性能优化就像给网站做体检，而 FCP、LCP、TTI 这些指标就是体检报告上的关键数据。看不懂它们，优化就无从谈起。

### 什么是 FCP (First Contentful Paint)？

**FCP（首次内容绘制）**，顾名思义，就是浏览器在屏幕上**第一次绘制出“有内容”的东西**的时间点。这个“内容”可以是文本、图片（包括背景图）、`<svg>` 元素，或者是非白色的 `<canvas>` 元素。简单来说，就是从用户输入网址按下回车，到页面上出现第一个可见元素的耗时。它是用户感知到“页面活了”的第一个信号。

打个比方，你点了一份外卖。从下单到外卖小哥把餐送到你手上，这个过程就是整个页面的加载过程。而 FCP，就相当于你第一次从猫眼里看到外卖小哥的身影。虽然你还没拿到外卖，但你知道，它来了！你的焦虑感会大大降低。

一个优秀的 FCP 时间应该控制在 **1.8 秒**以内。如果超过这个时间，用户就可能开始变得不耐烦了。

**如何测量 FCP？**

现代浏览器提供了 `PerformanceObserver` API，让我们可以轻松地在代码中监控 FCP。

```javascript
// 创建一个 PerformanceObserver 实例来观察 'paint' 类型的性能条目
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 我们只关心 'first-contentful-paint'
    if (entry.name === 'first-contentful-paint') {
      console.log(`FCP time: ${entry.startTime}ms`);
    }
  }
});

// 开始观察，buffered: true 表示我们也可以获取在观察开始前就已经发生的 paint 事件
observer.observe({ type: 'paint', buffered: true });
```

这段代码就像在你家门口装了个监控，专门等着外卖小哥出现，一出现就立刻告诉你。

### FCP 的“兄弟们”：LCP 和 TTI

当然，只看到外卖小哥的身影还不够，我们还关心什么时候能吃到嘴里，以及这个外卖是不是“货不对板”。这就引出了 FCP 的两个重要兄弟：LCP 和 TTI。

*   **LCP (Largest Contentful Paint，最大内容绘制)**: 如果说 FCP 是开胃菜，那 LCP 就是主菜。它测量的是视口内**最大的图片或文本块**完成渲染的时间。LCP 告诉我们页面的主要内容大概什么时候对用户可见。一个好的 LCP 时间应该在 **2.5 秒**以内。

*   **TTI (Time to Interactive，可交互时间)**: 这个指标衡量的是页面何时**完全具备交互能力**。也就是说，不仅内容都显示出来了，而且主线程也已经空闲，可以随时响应用户的点击、滚动等操作了。TTI 就像你不仅拿到了外卖，还拆开了包装，拿起了筷子，准备开吃的那一刻。

### 灵魂拷问：我们应该关注哪个？

FCP、LCP、TTI，它们从不同维度衡量了页面的加载体验。FCP 关注“有没有”，LCP 关注“主要内容有没有”，而 TTI 关注“能不能用”。

对于优化来说，**FCP 是我们打响的第一枪**。因为它是用户体验的起点，一个糟糕的 FCP 会直接导致用户流失。优化了 FCP，通常也会对 LCP 和 TTI 产生积极的影响。所以，我们的策略是：**以 FCP 为突破口，全面提升页面加载性能！**

---

## 第二章：资源优化“瘦身”计划：让你的代码“轻”装上阵

知道了要优化 FCP，那具体该怎么做呢？首当其冲的就是给我们的资源“瘦身”。请求的资源越小、越少，浏览器就能越快地下载和解析它们，FCP 自然就快了。

### 代码分割 (Code Splitting)：别把所有“家当”一次性搬出来

想象一下搬家，你是会把所有东西——无论常用不常用——都打包进一个巨大的箱子，然后费力地一次性搬过去？还是会把东西分门别类，先搬必需品，其他的以后再说？

代码分割就是这个道理。传统的打包方式（比如早期的 Webpack）会把所有 JavaScript 代码打包成一个巨大的 `bundle.js` 文件。用户打开首页，就必须下载整个文件，哪怕其中 90% 的代码是其他页面才用得到的。这无疑大大拖慢了 FCP。

现代前端框架和打包工具都原生支持代码分割。核心思想就是：**按需加载**。

**实战：使用动态 `import()`**

ESM（ES模块）规范中的动态 `import()` 语法是实现代码分割的利器。它返回一个 Promise，让我们可以异步地加载模块。

```javascript
// 假设我们有一个按钮，点击后才需要加载一个比较大的图表库
const chartButton = document.getElementById('show-chart-btn');

chartButton.addEventListener('click', () => {
  // 在用户点击时，才去加载 'chart-library.js'
  import('./chart-library.js')
    .then(module => {
      const Chart = module.default;
      const myChart = new Chart(/* ... */);
      myChart.draw();
    })
    .catch(err => {
      console.error('Failed to load the chart library.', err);
    });
});
```

在 Vue 中，你可以使用异步组件；在 React 中，你可以使用 `React.lazy` 和 `Suspense`，它们的底层原理都离不开动态导入。

### 图片优化：不只是压缩那么简单

图片往往是网页中最大的资源，也是 FCP 优化的重点对象。

**1. 图片懒加载 (Lazy Loading)**

懒加载的思路是：只加载视口内（或即将进入视口）的图片，视口外的图片等用户滚动到附近时再加载。这能极大地减少首屏需要加载的图片数量。

过去我们可能需要监听 `scroll` 事件，计算元素位置，比较麻烦且性能不佳。现在，我们有了神器 `IntersectionObserver`！

```html
<img data-src="real-image.jpg" src="placeholder.jpg" alt="An amazing image">
```

```javascript
const lazyImages = document.querySelectorAll('img[data-src]');

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    // 如果图片进入了视口
    if (entry.isIntersecting) {
      const img = entry.target;
      // 将真实的图片地址放到 src 属性上
      img.src = img.dataset.src;
      // 移除 data-src，防止重复加载
      img.removeAttribute('data-src');
      // 停止观察这张图片
      observer.unobserve(img);
    }
  });
});

lazyImages.forEach(img => {
  observer.observe(img);
});
```

**2. 现代图片格式 (WebP/AVIF)**

别再抱着 JPEG 和 PNG 不放了！WebP 格式在同等画质下，体积比 JPEG 小 25%-35%。而更新的 AVIF 格式则更加优秀。使用 `<picture>` 元素，我们可以优雅地向后兼容：

```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="description">
</picture>
```

浏览器会从上到下检查，选择第一个它支持的格式进行加载。

### 字体优化：让文字不再“跳动”

自定义字体虽然好看，但如果处理不当，会导致 FOUT (Flash of Unstyled Text，无样式文本闪烁) 或 FOIT (Flash of Invisible Text，不可见文本闪烁)，这都会影响用户体验和布局稳定性。

**`font-display: swap;`** 是一个简单有效的解决方案。在你的 `@font-face` 规则中加入它：

```css
@font-face {
  font-family: 'MyAwesomeFont';
  src: url('/fonts/my-awesome-font.woff2') format('woff2');
  font-display: swap;
}
```

`swap` 的作用是，让浏览器先用系统默认字体渲染文本，等自定义字体下载完成后再替换掉。这样用户可以第一时间看到内容，避免了 FOIT。

另外，**字体子集化 (Subsetting)** 也是一个大杀器。如果你的网站只需要用到几百个汉字，就完全没必要加载包含数万个汉字的全量字体包。可以使用 `font-spider` 等工具，根据你的页面内容，生成一个只包含你用到的字符的迷你字体包，体积能减少 90% 以上！

---

## 第三章：传输优化“高速公路”：让资源“飞”到浏览器

资源“瘦身”后，我们还要为它们铺设一条高速公路，让它们能以最快的速度到达浏览器。

### 预加载资源：`preload` vs `prefetch`

浏览器在解析 HTML 时，会按顺序发现并下载资源。但有时我们比浏览器更清楚哪些资源是关键的。这时就可以使用 `preload` 和 `prefetch` 来“指点”浏览器。

*   **`<link rel="preload">`**: 告诉浏览器：“这个资源非常重要，是当前页面马上就要用到的，请你**立刻以高优先级**下载它，但先别执行。” 它常用于预加载 CSS、字体文件，或者页面后半部分才会发现的关键 JS。

    ```html
    <!-- 预加载关键的 CSS 文件 -->
    <link rel="preload" href="critical.css" as="style">

    <!-- 预加载字体文件，注意 crossorigin 属性 -->
    <link rel="preload" href="/fonts/my-font.woff2" as="font" type="font/woff2" crossorigin>
    ```

*   **`<link rel="prefetch">`**: 告诉浏览器：“这个资源当前页面用不到，但是**下一个页面很可能会用到**，你可以在空闲的时候，以低优先级去下载它。” 它非常适合用在预加载用户下一步可能访问的页面的资源。

    ```html
    <!-- 用户在看产品列表页，我们可以预取产品详情页的 JS -->
    <link rel="prefetch" href="product-detail.js" as="script">
    ```

两者的区别就像：`preload` 是你做饭前，先把要用的葱姜蒜都准备好；而 `prefetch` 是你猜明天可能要吃饺子，就提前把肉馅给解冻了。

### HTTP/2 的“超能力”

如果你的网站还在用 HTTP/1.1，那 FCP 优化就输在了起跑线上。HTTP/2 带来了几个革命性的特性，对性能提升巨大：

*   **多路复用 (Multiplexing)**: HTTP/1.1 时代，浏览器对同一个域名下的并发请求数量有限制（通常是6个）。请求需要排队，这就是“队头阻塞”。而 HTTP/2 可以在一个 TCP 连接上同时发送和接收多个请求和响应，彻底告别排队！这意味着我们可以放心地把 CSS 和 JS 拆分成更多的小文件，配合代码分割，效果更佳。

*   **头部压缩 (Header Compression)**: 使用 HPACK 算法压缩请求头，减少了传输的数据量。

现在，主流的服务器和 CDN 都已支持 HTTP/2，开启它通常只是一个配置开关的问题，是性价比极高的优化手段。

### CDN：你的“全球快递网络”

CDN (Content Delivery Network，内容分发网络) 的原理很简单：把你的静态资源（JS, CSS, 图片等）复制到全球各地的服务器节点上。当用户访问时，会自动从离他**物理距离最近**的节点加载资源，大大减少了网络延迟。

这就像你在北京，想买一本只在广州卖的书。没有 CDN，就得等书从广州慢慢寄过来。有了 CDN，这本书在北京的仓库就有存货，你下单后，同城配送，速度不可同日而语。

将静态资源部署到 CDN 是 FCP 优化的基础操作，效果立竿见影。

---

## 总结：告别白屏，从我做起

好了，今天的“屠龙之术”就传授到这里。我们来快速回顾一下：

1.  **理解指标**：FCP 是我们向白屏宣战的号角，它衡量的是用户看到第一个内容的时刻。
2.  **资源瘦身**：通过**代码分割**、**图片懒加载**和**现代格式**、**字体优化**，从源头上减少资源的体积和数量。
3.  **传输加速**：利用 **`preload`** 预加载关键资源，拥抱 **HTTP/2** 的多路复用，并借助 **CDN** 将资源部署到用户身边。

性能优化不是一蹴而就的，它是一个持续的过程。现在，就打开你自己的网站，按下 F12，打开 Lighthouse 或 Performance 面板，给它做一次全面的“体检”吧！看看你的 FCP 是多少，然后运用今天学到的知识，开始你的优化之旅。

在下一篇文章中，我们将深入探讨如何榨干 Webpack 的最后一滴性能，从构建层面让你的应用快人一步。敬请期待！

---

### 参考资料

*   [FCP优化 - 简书](https://www.jianshu.com/p/f2d012fda9d8)
*   [读懂前端「性能优化」 - 七猫技术团队](https://tech.qimao.com/yi-wen-du-dong-qian-duan-xing-neng-you-hua/)
*   [Web Performance Optimization：前端性能优化全方位指南 - 阿里云开发者社区](https://developer.aliyun.com/article/1477970)
*   [web前端应用性能指标优化方案有哪些？ - csuwujing - 博客园](https://www.cnblogs.com/csuwujing/p/18282283)
*   [前端性能精进之优化方法论（一）——测量 | HeapDump性能社区](https://heapdump.cn/article/5401439)