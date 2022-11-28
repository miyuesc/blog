---
highlight: an-old-hope
theme: hydrogen
---

持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第N天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

## 前言

在之前的文章[利用 SplitingJS 配合 CSS 实现文字"蠕动"效果](https://juejin.cn/post/7154740084342784013) 中实现了一个文字动画，原理就是利用 SplittingJS 拆分一个字符串并配合 AnimationDelay 实现每个字符依次放大缩小，虽然其中 AnimationDelay 的值的设定是通过 js 来实现的，但是也可以把这部分通过 css 变量的形式使用纯 CSS 来实现。文章里也提到了 SplittingJS 也支持拆分图片，所以是不是可以利用这个方法配合 CSS 实现更加炫酷的图片动画呢？

答案是肯定的啦~

本文就带大家利用这个库来实现一个图片动态放大预览的效果。

## Splitting 拆分图片

首先，我们先看一下 SplittingJS 拆分图片时接收的参数。

### 分析拆分方法

上文说到在调用 **Splitting()** 方法时，可以传递两个参数 **target** 和 **by**，其中 **by** 指定了拆分时时候哪种拆分模式，默认是拆分为单个字符。

但是图片肯定是无法按照字符拆分的。通过阅读文档，发现图片可以通过 **cells** 模式拆分为 **单元格形式**。此时接收参数如下：

```javascript
const results = Splitting({
  target: '.image',
  by: 'cells',
  image: true,
  columns: 2,
  rows: 2
})
```

此时的 **target** 和 **by** 参数的定义仍然与之前的定义一致，但是增加了三个参数：

- image：布尔类型，表示拆分的元素是否是图片
- columns：拆分后每行的元素个数
- rows：拆分后每列的元素个数

> 使用 **cells** 模式必须要引入 **splitting-cells.css** 文件，否则需要自己实现 **grid** 类布局。

### 拆分图片

假设现在我们有这样一个 Dom 结构，里面有一个图片：

```html
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1067" />
</div>
```

显示效果如下：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6bfb7632d8b84a73a9b2fe6adbd0c5cf~tplv-k3u1fbpfcp-watermark.image?)

然后我们调用 **Splitting()** 进行拆分：

```javascript
Splitting({
  target: '.tiler',
  by: 'cells',
  rows: 3,
  columns: 3,
  image: true
});
```

拆分后的 Dom 结构就变成了一下格式：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cbf78c79ffcc4bc3a10dd017c744def3~tplv-k3u1fbpfcp-watermark.image?)

此时在这个 div 的内部，也就是与 img 标签平级的地方，被插入了 **1个 span** 标签，并且这个 **span** 标签采用 **grid** 布局将内部分成了 **9** 分，也就是我们传入的时候的参数 **`columns * rows`** 。

在外层的 div 上也被设置了一个 **背景图片** 和 **4 个 CSS 变量**，生成的每个 **span.cell** 标签上也一样有 **4个 CSS 变量**；并且该 div 元素上还会增加相应的一系列 class 类名（与 splitting-cells.css 默认样式有关）。

我们的图片区域也一样被分为了 9 份。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/22f501aca4f44ee2bde353d0148e55f6~tplv-k3u1fbpfcp-watermark.image?)

> 需要注意的是，每个 **span.cell** 标签内部还有一个 **span.cell-inner** 标签，该标签保留了 **与最外层元素一样的尺寸**。
>
> 并且，splitting-cells.css 文件中默认生成的 **span.cell-grid** 采用 **absolute 绝对定位** 来固定与外层元素的位置的，所以后面的动画会对其进行一定修改。

## 基础样式

为了实现预览图片 **从后往前** 透出来的效果，我们可以通过 **perspective** 或者 **transform-style** 实现 3D 效果。

首先，我们先设置基础样式：

```css
html { 
  height: 100%;
  display: flex; 
  background: #323643; 
}
body { 
  display: flex; 
  flex-wrap: wrap; 
  max-width: 800px; 
  padding: 2em; 
  margin: auto; 
}
.tiler {
  display: inline-block;
  cursor: pointer;
  visibility: hidden;
  width: 100%;
  margin: auto;
}
.tiler img { 
  display: block;  
  margin: auto; 
  max-width: 100%;
  visibility: visible;
}
```

此时页面中图片呈现一个水平垂直居中的状态，并且保证了最大宽度。

**然后，我们为 span.cell-grid 开启 3d 模式**。

```css
.tiler .cell-grid {
  z-index: 10;
  perspective: 1px; // 只需要设置一个正值开启 3d 即可
}
```

## SplittingCells.css 分析

**我们在回头看一下 splitting-cells.css 内部对每个拆分后的单元格 span 标签有什么处理。**

```css
.splitting.cells {
  position: relative;
  overflow: hidden;
  background-size: cover;
  visibility: hidden;
}
.splitting .cell-grid {
  background: inherit;
  position: absolute;
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  display: grid;
  grid-template: repeat( var(--row-total), 1fr ) / repeat( var(--col-total), 1fr );
}
/* Helper variables for advanced effects */
.splitting .cell {
  --center-x: calc((var(--col-total) - 1) / 2);
  --center-y: calc((var(--row-total) - 1) / 2);

  /* Offset from center, positive & negative */
  --offset-x: calc(var(--col-index) - var(--center-x));
  --offset-y: calc(var(--row-index) - var(--center-y));

  /* Absolute distance from center, only positive */
  --distance-x: calc( (var(--offset-x) * var(--offset-x)) / var(--center-x) );
  /* Absolute distance from center, only positive */
  --distance-y: calc( (var(--offset-y) * var(--offset-y)) / var(--center-y) );
}
```

> 省略了小部分基础样式，不是很影响显示和动画配置。

**cells 和 .cell-grid**：

通过上面的 dom 结构分析，可以知道分别是 **最外层的 dom** 和 **生成 grid 布局的拆分后元素父级**，在默认样式中分别进行了 **隐藏显示** 和 **绝对定位** 的处理。

**cell**：

这里为了支持高级动画，在生成的每个 **span.cell** 标签下都设置了对应的 CSS 变量：

- `--center-*`：中心点元素的序号
- `--offset-*`：与中心元素的距离（元素个数；左负右正，上负下正）
- `--distance-*`：与中心元素的距离绝对值

我们可以通过这些变量来配置更复杂的动画。

## 动画分析和实现

在上面的 CSS 变量中，通常采用的是 `--center-*` 或者 `--distance-*` 来配置 **从中心发散或者聚拢的动画**，利用 `--offset-*` 来设置 **从左到右、从右到左之类的顺序动画**。

现在我们利用 `--distance-*` 来设置一个 **中心开始复现的效果**。上面基础样式中已经开启了 3d 效果，这里我们直接从单元格开始。

因为要实现 **从中心发散且复现图片的效果**，所以先将 cell 中的单元格缩小和隐藏（透明度），并将元素向下层下沉；然后在 **鼠标滑过外层图片时取消下沉和透明度**

```scss
.tiler .cell { 
  opacity: 0;
  transform: translateZ(-1px);
}

.tiler:hover {
  .cell { 
    transform: scale(1); // 因为开启了 3d，按比例缩小了一些，所以这里需要缩放回正常状态
    opacity: 1;
  }
}
```

**当然，此时依然没有什么效果；还需要我们指定动画的样式部分和动画时间。**

```scss
.tiler .cell { 
  transition-property: transform, opacity;
  transition-duration: 0.5s;
}
```

**现在，当鼠标一上去之后就有一个 中心小图片放大到覆盖原有图片 的效果**（有兴趣的同学可以在下面的代码中注释掉延迟部分和动画执行时间曲线）。

**然后，就是根据 `--distance-*` 来设置不同的动画延迟，让它更加炫酷**。

```scss
.tiler .cell { 
  transition-timing-function: cubic-bezier(.65, .01, .15, 1.33);
  transition-delay: calc( 0.1s * var(--distance-y) + 0.1s * var(--distance-x) );
}
```

效果如下：

[代码片段](https://code.juejin.cn/pen/7155855039779569698)

## 九宫格升级

上面的动画只实现了 **单个图片的原尺寸动画**，那么实现一个 **九宫格并且动画更大的效果呢**？基本原理也是差不多的。

**首先，创建一个九宫格显示的图片节点**。

```html
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1067" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1061" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1057" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1052" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1043" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1055" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1036" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1037" />
</div>
<div class="tiler">
  <img src="https://picsum.photos/1000/600?image=1039" />
</div>
```

**然后，依旧使用 SplittingJS 进行拆分**

> 因为拆分逻辑是一样的，这里就省略了

**最后，就是调整动画了。**

因为默认样式对其进行了显示，超出外层节点会隐藏，所以我们 **取消绝对定位，改用固定定位**。因为默认的原始图片区域处理页面中心，所以 **拆分后生成的 span.cell-grid 标签也可以固定到页面中心位置，并调整四周间距让其大于原始图片区域**。

> 这里为了原始图片区域的尺寸不超过之前设置的区域尺寸，将每个默认图片的大小改成了 33.3%；为修改的地方与上面的单张图片样式一致

```scss
.tiler {
  width: 33.3%;
}
```

**修改 span.cell-grid 样式为固定定位，调整大小。**

```scss
.tiler .cell-grid {
  margin: auto;
  position: fixed;
  top: 1em;
  bottom: 1em;
  left: 1em;
  right: 1em;
  z-index: 10;
  max-width: 1000px;
  max-height: 600px;
  perspective: 0;
}
```

其他的动画部分因为不涉及特定的尺寸和位置，所以也不需要调整。

最终效果如下：

[代码片段](https://code.juejin.cn/pen/7155702326458581031)

## 最后

作为一个纯粹的 **”元素拆分“** 的工具函数，SplittingJS 对文字、图片、元素节点等情况下的拆分都进行了很好的适配，并且也为开发者提供了默认的样式与 CSS 变量来帮助开发者节约开发时间，帮助完成各种复杂动画。

后面也会继续研究 SplittingJS 在 CSS 动画上的一些效果实现，另外还有 gsap 动画库、svg、canvas 等也是实现复杂动画的好帮手，也希望能在学习这些的过程中加深对 CSS 的掌握程度。
