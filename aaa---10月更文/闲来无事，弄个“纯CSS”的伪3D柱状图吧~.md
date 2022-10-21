---
highlight: an-old-hope
theme: hydrogen
---

持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第N天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)


## 前言

最近在忙公司的一个大屏项目，因为是半路参加的，只是为之前的同事修改一些样式问题，并把之前的UI切换改变成用代码编写的形式，提高一下加载效果。

在这个过程中也算是有一些比较有意思的效果，今天先弄一个 “伪3D” 的柱状图吧。

## 样式设计

UI 给的稿子上，通常会带有一些“**细微**”的样式，用来提高观赏性，但是这里为了加快速度，我们就先实现一个比较 “**比较纯粹**” 的柱状图。

首先上效果图：


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/68a864378aef4648928895d50ca0fc8d~tplv-k3u1fbpfcp-watermark.image?)

**我们大致拆分一下整体结构**。

首先是外层的划分，包含：顶部的盖子，中间反映数据值的圆柱，以及底部的底座；其中顶部和底部的样式基本一致。然后中间部分又可以分成 **外部的渐变遮罩**，和 **内部的实际数据圆柱**。

然后，我们就可以着手实现了。

> 大家也别说为什么下面要用 Vue，主要还是为了在项目中写成组件复用，显示效果的实现还是全部用的 css 的。

## 圆柱的实现

圆柱的实现呢是参考了 [吼吼酱 -- css3绘制3D图形——圆锥、圆柱、柱状图](https://juejin.cn/post/6844903970738012168) 一文的。

单个圆柱拆分成 3 个部分来实现，结合 dom 的 **伪类 before 和 after** 刚刚好可以实现，配合**渐变效果** 即可模拟出一个 3d 圆柱。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6b9f4c9415d4cd4bf917d547be6963b~tplv-k3u1fbpfcp-watermark.image?)

这里我们以我们UI图最顶上的一部分来举例。整个 Dom 结构如下：

```html
<div class="weighted-cylinder">
  <div class="weighted-cylinder__header"></div>
</div>
```

配合一个 css 样式：

```scss
.weighted-cylinder {
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
  padding: 0;
  .weighted-cylinder__header {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    z-index: 20;
    height: 10%;
    background: linear-gradient(to right, #6776f8, #4bc5fe);
    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 40px;
      border-radius: 50%;
    }
    &::before {
      z-index: 3;
      top: -20px;
      background: linear-gradient(to right, #66c8ff, #92e1fe);
    }
    &::after {
      z-index: 1;
      bottom: -20px;
      background: linear-gradient(to right, #6776f8, #4bc5fe);
    }
  }
```

> 这里用了**绝对定位** 来方便布局哈

此时就得到了这样的一个圆柱：


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2682169ad6434f75bde0b3372ccfc2f8~tplv-k3u1fbpfcp-watermark.image?)

**当然，这里也需要注意一下几点**：

1. 采用绝对定位除了方便布局，也是为了设置各个部分的**层级**，避免出现错误覆盖
2. 在**单个圆柱中**，我们用 before 模拟了盖子部分，after 模拟的底座部分，所以顶部盖子的层级应该是最高的，而底座则是最低的
3. 在整体的柱状图中，为了模拟 3D 效果，中间的**数值反应的圆柱**在到达最大值时肯定还是被最顶上的 header 部分覆盖的，所以 header 部分的层级也是最高的
4. 底部的元素应该可以被中间部分覆盖，所以肯定也是最低的

**当然还有渐变色的处理，底座部分模拟了一部分圆柱外立面，所以需要与实际的柱面渐变配置一致；而盖子部分则应该选取同色系中的亮色，来模拟高亮**。

## 组件的设计与实现

上面介绍了单个圆柱的实现，那么整个组件的实现也就差不多了；只是在单个圆柱的基础上再实现三个圆柱，调整相互的位置即可实现。

整个组件的 dom 部分结构如下：

```html
<div class="weighted-cylinder">
  <div class="weighted-cylinder__header"></div>
  <div class="weighted-cylinder__content">
    <div class="cylinder__content-inner" :style="computedStyle"></div>
  </div>
  <div class="weighted-cylinder__footer"></div>
</div>
```

> 其中 header、content、footer 分别是外层的盖子、中心数据展示区、底座 三个部分；因为数据显示的部分需要计算高度和定位，并且需要确定层级，所以将它放置在 content 中会更加方便。
>
> 因为作为 content 的子元素，它自己的层级调整不会影响外部 content 的整体层级，并且使用百分比高度也更加容易计算，100% 时就是 content 区域的高度

该组件接收一个小数用来确定 **数据映射圆柱的高度**，通过 Vue 计算属性和动态样式的方式来处理：

```javascript
export default {
  name: "WeightedCylinder",
  props: {
    data: {
      type: Number,
      default: 0.2
    }
  },
  computed: {
    computedStyle() {
      const style = { height: `${this.data * 100}%` };
      return style;
    }
  }
};
```

最后，则是我们的 **css 实现部分**。

因为外层的 header 盖子与 footer 底座其实与上面说的单个元素样式一样，只需要修改定位参数即可。

而中间的 content 部分其实也只是 **改变了渐变背景色的透明度**，这里可以直接通过**rgba**完成。

```scss
.weighted-cylinder__content {
  position: absolute;
  left: 0;
  right: 0;
  top: 10%;
  bottom: 10%;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(102, 200, 255, 0.2));
}
```

**最后，就是 inner 数据映射圆柱了**。因为高度不定（数据不确定），并且圆柱的基准位置一般也是以底部为准，所以这里通过 **绝对定位** 将 **inner** 部分固定在**content** 区域的底部，然后直接调整圆柱高度。至于样式，也和上面的差不多。

```scss
.cylinder__content-inner {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 0;
  background: linear-gradient(to right, #12e49a, #2c86e1);

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  &::before,
  &::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 32px;
    border-radius: 50%;
  }
  &::before {
    top: -16px;
    background: linear-gradient(to right, #53d3fa, #56d9f8);
  }
  &::after {
    bottom: -16px;
    background: linear-gradient(to right, #12e49a, #2c86e1);
  }
}
```

这样，我们就得到了一个完整的 3D 柱状图了。


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/620bb661dc4d480f87123578f133aee9~tplv-k3u1fbpfcp-watermark.image?)

## 扩展

当然，作为一个柱状图，很多时候我们要 **在内部显示这个柱状图反应的哪个类型的数据，具体数值是多少**，所以我们可以在内部增加两个标签用来显示这两个信息，并且 **添加一个插槽来显示开发者需要自定义的内容**。

当然，既然是 **可能会显示** 其他信息，那么**数据类型和数据数值的显示应该也可以控制**，这时就需要再添加对应的控制参数了。

最终我们的 dom 结构如下：

```html
<div class="weighted-cylinder">
  <div class="weighted-cylinder__header"></div>
  <div class="weighted-cylinder__content">
    <div class="cylinder__content-inner" :style="computedStyle">
      <div v-if="showData" class="cylinder__content-data">{{ data }}</div>
      <div v-if="showTitle" class="cylinder__content-title">{{ title }}</div>
      <slot></slot>
    </div>
  </div>
  <div class="weighted-cylinder__footer"></div>
</div>
```

然后定义了相关的 props 配置和计算属性：

```javascript
props: {
  data: {
    type: Number,
    default: 0.2
  },
  title: {
    type: String,
    default: "权重"
  },
  showData: {
    type: Boolean,
    default: true
  },
  showTitle: {
    type: Boolean,
    default: true
  },
  reverse: {
    type: Boolean,
    default: false
  }
},
computed: {
  computedStyle() {
    const style = { height: `${this.data * 100}%` };
    if (this.reverse) {
      style.flexDirection = "column-reverse";
    }
    return style;
  }
}
```

**这里还增加了一个 reverse 配置，用来控制 title 与 data 数值的顺序（谁在上谁在下）**
。这样我们还需要设置相应的样式：

```scss
.cylinder__content-inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.cylinder__content-data,
.cylinder__content-title {
  z-index: 100;
}
.cylinder__content-data {
  font-size: 20px;
  font-weight: bold;
}
.cylinder__content-title {
  font-size: 16px;
}
```

最终我们就得到了想要的效果：

[代码片段](https://code.juejin.cn/pen/7156601272190107663)

## 其他扩展

看到这里我相信大家肯定还有其他更多的需求需要对这个代码进行调整，比如中间的**文字大小、文字颜色**等，另外也有可能需要 **调整渐变色**、增加box-shadow模拟发光效果等。

这些当然可以根据实际情况进行调整，希望大家有这样的或者更好的意见，也可以提出来帮助我一起改进这个组件。


### 往期精彩

[Bpmn.js 进阶指南](https://juejin.cn/column/6964382482007490590)

[Vue 2 源码阅读理解](https://juejin.cn/column/7136858810605371399)

[一行指令实现大屏元素分辨率适配(Vue)](https://juejin.cn/post/7148476639343542279)

[基于 Vue 2 与 高德地图 2.0 的“线面编辑器”](https://juejin.cn/post/7142746736690200612)