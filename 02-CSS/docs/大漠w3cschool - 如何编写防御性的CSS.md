>作者：[大漠](https://www.zhihu.com/people/w3cplus)
>链接：[https://zhuanlan.zhihu.com/p/459599582](https://zhuanlan.zhihu.com/p/459599582)
>来源：知乎
>著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

转载信息
--

大漠，W3CPlus 创始人，曾就职于淘宝。对 HTML、CSS 和 A11Y 等领域有一定的认识和丰富的实践经验。CSS 中国布道者，2014 年出版《图解 CSS3：核心技术与案例实战》。2023年完成掘金小册 [《现代 Web 布局》](https://s.juejin.cn/ds/BU64f3s/)，**用了约 1000 张示意图和 800+个真实的 Demo**，带大家深入了解和掌握构建现代 Web 布局的技术细节和技巧~

----

现状
--

@克军老师在他的文章（内网文章，不便贴链接）开头有这么一段话：

> **当前CSS开发的现状不容乐观，扫了一圈，发现各种问题。前端开发更多关注点还是 JavaScript，技术性相对更强。但从前端技术的根本价值出发，实现高可用性的产品用户界面，是用户体验的第一道关，这就跟 CSS 开发者的专业性紧密相关了。我认为体现 CSS 开发专业性看的就是防御式 CSS 开发。**

稍微老一点的前端工程师都应该知道，在还没有前端这个职位的时候有一个名叫”重构“职位（有的公司称为重构工程师，有些人自嘲是”切图仔”）。嗯，我就是从这个岗位走过来的，一直延续到今天。大多数的时候，重构工程师的主要工作内容是 **还原UI界面**，即编写HTML结构（具有语义化的HTML结构）、编写CSS（具有扩展性，可维护性）和切图等。

> 这样的事情看上去似乎很简单，但是不是真的简单，我想只有自己知道！

就是这样的一群工程师，他们面对的是用户和设计师两个群体，也是他们之间的桥梁。也正是这么一群工程师，他首先将设计师的意图还原出来，以最好的一面呈现给用户。我想不少前端同学都碰到这样的怪象：

> **页面出了问题，不管三七二十一先找前端。大多数发现问题都可能是先在面上展现出来，比如说，布局乱了、UI不对、没有展示出来等等！**

事实上呢？这都是题外话，我们还是回到正题中来。

![动图封面](https://pic3.zhimg.com/v2-ab4d5494aeeb6c0b1aaa3046d7ac4bda_b.jpg)

CSS 开发者（现在并没有这样的职位）是第一个将设计呈现给用户的。CSSer 和设计师经常打交道，可以说是“相爱相杀”。为什么会这样呢？那我们就要从“像素级还原的故事”讲起。

> 不知道你听到“**像素级还原**这个词是什么时候？”

简单地说，**“像素级还原”就是设计师希望你还原的UI设计稿能达到100%的还原**。或许时至今日，你在工作中还会因为一个像素的偏差和设计师争得面红耳赤，甚至会因为这一个像素不欢而散。说实话，不同的角色站在不同的角度为这一个像素而争：

-   **设计师**：希望自己设计出来的作品呈现给自己用户时完全不打折扣
-   **开发人员**：不是我不想像素级还原，而是很多时候也是无耐

换句话说，都是“打工人”，都不容易。暂且抛开这些争执，先来看看什么是像素级还原。

“像素级”这个概念是由设计师和客户一起创造出来的，因为他们要求自己的设计稿必须反映出设计，并且要和设计一模一样。当设计师把完成的设计稿交给前端开发人员时，他们相信前端会完全不打折扣地实现他们的设计。他们的工作是通过Web前端的实现来完成的，他们希望Web在实现过程中不要损坏他的设计稿：

![](https://pic1.zhimg.com/v2-8bc7ff94ceea60c178805eb3529f89c4_b.jpg)

而设计稿最终要在浏览器（或客户端）中向用户呈现，因此最终像素级还原（设计师的意图）转嫁到前端中：

> 指在HTML和CSS能100%的实现设计稿的效果，一个像素也不差。

我也经常听到这样的担忧：

> 许多Web前端开发人员难以完美再现一个设计，即使是有多年前端经验的Web开发者。

对于Web开发者来说，很多时候他是无辜和无耐的，即使在Web开发时严格的按照设计师提供的设计稿进行还原，精确的字号，准确的间距等，但最终实现出来的总是有一定差异的，比如下图：

![](https://pic3.zhimg.com/v2-66f77d4a1362eb58816352b88570d21a_b.jpg)

看上去似乎是一样，但我们将其叠加到一起，就能看到它们之间的差异：

![](https://pic1.zhimg.com/v2-40c943891cacfbcd6f0bbbd5883723dc_b.jpg)

而这种结果很容易被认为是不完美（不是像素级）的还原。那么在现实中，像素级的还原是否就是完美的呢？

先把这个问题说清楚。从严格意义上来说，个人认为完美的像素级还原是不可能的。因为Web开发人员在编写HTML和CSS需要在各种设备终端上运行，而时至今日，这些终端设备足以让我们感到眼花缭乱。换句话说，将有很多的变量会影响我们编码出来的Web页面渲染。比如将淘宝PC端在Chrome和Safari浏览器中效果截取出来，并且并排在一起看时，这两张截图似乎非常相似，没啥问题：

![](https://pic2.zhimg.com/v2-c028b970c4745a0102e7fa66f2db66e5_b.jpg)

但将他们合在一起看时，差异就立马显现出来了：

![](https://pic4.zhimg.com/v2-285b768f2f1a4fb4d1aa6be7f8d1700b_b.jpg)

上图只是其中一个变量的差异（同一系统下不同的两个浏览器）。想想，现实中还有多少因素会影响到Web页面的，比如:

-   设备类型（台式机电脑、笔记本电脑、平板电脑、手机、手表等）
-   屏幕（或视窗）大小
-   屏幕像素密度（比如Retina屏幕和非Retina屏）
-   屏幕技术（比如，OLED、LCD、CTR等）
-   用户的操作（比如用户对屏幕进行缩放、调整默认字号等）
-   性能（比如，设备硬件、服务器负载、网络速度等）
-   设备色彩样正（比如夜间模式，iOS的暗黑模式等）

这仅是我能想到的，还有很多我想不到的呢？也就是说，我们永远无法确保屏幕上单个像素的RGB值百分百的一致。这是一个不可能的标准。但这也不是真正的重点。

另外，也没有人要求东西在放大镜下看起来是一样的。大多数情况下，设计师希望实现的东西看起来和肉眼一样（像素眼除外），并且收紧明显的错位和松散的间距。他们希望它是像素般接近的，而不是像素般完美的。

> **没有像素级还原就不完美？**

前面两个示例都向大家展示了，Web开发人员在还原设计师提供的设计稿时，总是会存在差异，而且影响这方面的差异的因素非常地多。而这种效果在设计师眼里很容易被认为是不完美的。那么在现实中，它是否真的不完美？

在回答这个问题前，我们把时间拉回十年前。

在2010年，设计师或客户要求前端在还原设计稿时应该是一个像素级还原，这对于Web开发人员可能是可以做到的。因为在那个年代，Web在呈现的终端设备类型毕竟不多，大多在PC台式机上展示，笔记本也不多，更不用说现在这么多的移动终端设备了。Web开发者要考虑的屏幕尺寸数量也不多。简单地说就是PC页面尺寸，比如大家熟悉的 `960px` 宽度，或者后来的 `1024px` 宽度已经足够用了。然而，随着成千上百万的设备（智能手表，智能手机，平板电脑，笔记本电脑，台式机，电视等），像素级还原将不会是件易事，甚至是不可能的事情了。

> 这样的话从一名Web开发者口中说出，并不代表说Web开发者没有匠心精神，没有追求。

最近看一个新词“看（外观）和感觉”。放到我们Web设计中来看，“看（外观）”指的是从UI的角度看，一个Web网站的外观如何；而感觉主要是从Web功能和交互性的角度看。

我截了两张图：

![](https://pic4.zhimg.com/v2-b91b3c47e2ff0b1f11d72e36de6dd02b_b.jpg)

上图是截取于Youtube首页，两者不同之处只是我在第二张图上对几个地方的颜色做了些许的调整。如果不专注看的话，这些小小的变化或许就把你忽悠了。感觉上两者并没有差异。

我们再来看另一张图：

![](https://pic2.zhimg.com/v2-6fdcb9a4546d513305d5bb3d9d4b2485_b.jpg)

左图是原始设计图；右图是Web前端开发出来的页面效果！

你可能已经发现两者之间的差异了吧，而且差异不小，这些差异显著影响了最终结果。上图展示的只是其中一个组件，这些差异只影响了一个卡片组件。或许有人会说这些差异很微小，并不重要，至少没有影响到功能和用户的交互。或许对于一个单一的组件，这样说法是对的。试想一下，如果所有组件都有一点或一些小差异，又将会是什么样的结果。

> 最终你将实现一个不完美的结果！

作为Web开发者而言，要修复这些差异很容易。然而，Web开发人员还原出来的结果和设计稿存有差异却有诸多原因，而这些原因会因不同的原因而不同。比如：

-   懂不懂设计
-   有没有足够的项目开发时间
-   CSS方面能力怎么样
-   是否注重细节

简而言之，不管是什么原因，我始终不认为开发者不知道如何修复还原出来的差异，让最终效果更接近原始设计稿（达到设计师诉求）。对于我来说，我认为每个Web开发者都有一个思维模式。当开发者有一定的设计知识（或能力）的时候，你会发现还原出来的Web页面结果在差异性方面就会小很多；反之，如果Web开发人员对设计方面一点都不懂，那么还原出来的结果和设计稿相比就会差得比较大。

似乎要让 UI 完美的像素级还原并不仅仅是按照设计稿完成UI页面即可，这里面还会涉及到很多和设计相关的话题，但这方面的话题并不是我们今天要讨论的。

既然说到完美还原，那作为一名专业的CSSer来说，怎么的还原才是一个完美的还原呢？那就是我们今天要讨论的正题了。

[维基百科](https://en.wikipedia.org/wiki/Defensive_programming)是这样定义防御性编程的：

> **防御性编程**（Defensive programming）是防御式设计的一种具体体现，它是为了保证，对程序的不可预见的使用，不会造成程序功能上的损坏。它可以被看作是为了减少或消除墨菲定律效力的想法。防御式编程主要用于可能被滥用，恶作剧或无意地造成灾难性影响的程序上。

在 UI 还原的过程中，设计师提供的设计稿是一种静态的产物，虽然优秀的设计师会在他的设计稿中展示出 UI 多态下的形态（表现形式），但他无法把动态数据完美的在设计稿中展示出来。如果 Web 开发者在还原 UI 的时候，仅仅是按照一比一的还原设计稿的话，就会产生很多问题（埋雷）。因为，Web页面在客户端中展示时，他面对的情况会很复杂，比如数据是动态的，设备是多样的等。这些东西的变化，都会增加 CSS 出问题的概率，甚至导致页面呈现的时候有一些奇怪的行为。简单地说，我们应该确保还原的 UI 能在不同的条件下都能工作。

要达到这样的基本要求，我们就应该具备“万一”（以防万一）的思维，即提前考虑一些特殊情况，比如一些边缘条件下可能会出现的情况。就我个人而言，我在还原 UI 的时候时常会问：

-   标题超长应该怎么处理？直接裁切，还是末尾添加三个点
-   数据没吐出呢？不处理还是将空白容器隐藏
-   容器变小呢？它应该怎么展示？
-   等等

除了这些展示的边缘情况，在使用CSS的时候也会有一些边缘情况（CSS中有些属性的组合就会触发）。

也就是说，我们在还原 UI 的时候，应该时常抱有“万一”的思维方式。遵循这种心态，至少可以减少你可能遇到的问题。一个坏的和一个好的区别，往往就是一行代码的问题。往往这简单的一行代码，会让你的 CSS 变得更健壮，更具防御性。

接下来是有关于具有防御性 CSS 的代码片段和场景的集合，在编写 CSS 时加上这些代码可以让你还原出来的 UI 更具保护性。

### 与 Flexbox 布局相关的防御式 CSS

CSS Flexbox 是目前最为主流的布局技术之一（在2022年，CSS Grid 也有可能成为主流布局技术之一）。很多 Web 开发者也首选 Flexbox 用作布局，但 Flexbox 用于布局时有一些细节需要掌握，掌握这些细节可以让你的 CSS 代码更健壮。

### `flex` 还是 `inline-flex`

众所周知，要使用 Flexbox 首要条件就是在一个容器元素上显式声明 `display` 的值为 `flex` 或 `inline-flex`，并该容器变成 Flexbox 容器（即，FFC）。他们的表现形式有点类似于`block` 和 `inline-block`。

当 Flexbox 容器的父元素未被 `display` 的值重新定义上下文格式之下：

-   设置为 `flex` 容器，它的宽度和父容器等宽，即 `width` 为 `100%`，也称块Flexbox容器
-   设置为 `inline-flex`容器，它的宽度是由其子元素（后代元素）的内容来决定，相当于 `width` 为 `auto`，也称内联Flexbox容器

![](https://pic4.zhimg.com/v2-db9f2319fb5c935ee77393c3b0ea68a3_b.jpg)

UI 设计也有与这个类似的场景：

![](https://pic4.zhimg.com/v2-c4da8018edd77e7a3b0bb6d077415b93_b.jpg)

如上面的设计稿中，按钮有的是和父容器宽度等宽的，有的是依赖内容（即内容节点的 `max-content`）决定的。为此，我们在使用 `display` 来显式声明 Flexbox 容器的时候，并不能不加思考的将所有 Flexbox 容器定义为 `flex`，更好的方式，根据UI的形态来定义 Flexbox 容器的上下文格式化方式：

```
.block-container {
    display: flex;
}

.inline-container {
    display： inline-flex;
}
```

这也将和未来的 `display` 模块相匹配，**[CSS Display Module Level 3](https://www.w3.org/TR/css-display-3/%23values)** 定义了 `display` 可以接受两个值：

```
.block-container {
    display: flex;

    /*相当于*/
    display: block flex;
}

.inline-container {
    display: inline-flex;
    /* 相当于 */
    display: inline flex;
}
```

这对于 CSS 来说是非常有意义的，也是很重要的。这样一来，代码就能正确地解释容器框（盒子）与其他框（盒子）的交互，即它们是块盒还是内联盒，以及子代的行为。对于理解`display` 是什么和做什么，就非常清晰了。这对于与UI 视觉元素的形态也有较好的匹配。

> **应该根据UI的视觉形态来正确的声明Flexbox容器，不能将所有Flexbox容器都声明为块盒！**

需要特别注意的是，Flexbox 容器为块盒和内联盒也会对Flex项目的伸缩性，特别是`flex-basis`有影响。具体有何影响，这里不阐述，感兴趣的同学可以阅读：

-   [Flexbox布局中不为人知的细节](https://www.w3cplus.com/css/unknown-details-of-the-flexbox-layout.html)
-   [聊聊Flexbox布局中的flex的演算法](https://www.w3cplus.com/css/flex-item-calculate.html)
-   [你真的了解CSS的 flex-basis 吗？](https://link.zhihu.com/?target=h%3Ccode%3Ettps%3A//www%3C/code%3E.w3cplus.com/css/the-difference-between-width-and-flex-basis.html)

### Flexbox中的换行

默认情况之下，位于Flexbox容器的所有子元素都会排在同一行（或同一列），但Flexbox 容器的可用空间是未知的。当Flexbox没有足够多的空间来容纳其所有 Flex 项目（其子元素）时，Flex 项目会溢出 Flexbox 容器，将会打破布局或出现滚动条：

![](https://pic2.zhimg.com/v2-d12f9f0a70971649884167f549a2c69d_b.jpg)

这种行为是预知的行为，并不能说是渲染问题，只不过他和我们预期或者说与设计师期望的效果不同。要解决这个问题，很简单，在Flexbox容器上显式设置 `flex-wrap`的值为 `wrap`（其默认值为`nowrap`）：

```
.flex-container {
    display: flex;
    flex-wrap: wrap;
}
```

我们应该尽量在Flexbox容器上使用 `flex-wrap` 来避免意外布局的行为。但另外有一点需要注意的是，`flex-wrap: wrap` 只有在Flex项目不能自动收缩扩展状态下有效，换句话说，如果在Flex项目中显式设置了 `flex: 1`时，即使你在Flexbox容器上显式设置`flex-wrap`为`wrap`也不能让Flex项目换行：

```
.flex-container {
    display: flex;
    flex-wrap: wrap;
}

.flex-item {
    flex: 1;
}
```

虽然在Flexbox容器中显式设置`flex-wrap`为`wrap`时可以预防布局溢出，但并不代表着在所有Flexbox容器上都设置，在具体使用过程中要有一个心理预判。比如下面这个是使用了`flex-wrap: wrap`的效果：

事实上，更好的效果应该是：

> **`flex-wrap: wrap` 碰到了 `flex:1` 并不会让 Flex 项目换行（或列），另外使用`flex-wrap: wrap` 要有一个心理预判，不然也有可能会让UI视觉上不美，但不会撑破布局！** 选择总是痛苦的（^\_^）

### `flex:1` 不一定能均分列

在现代 Web 布局中，特别是 Flexbox 布局，均分列（换句话说，均分容器，即等宽）都认为在 Flex 项目中显式设置 `flex: 1` 即可。

![](https://pic4.zhimg.com/v2-df857c46e071909a2f7d946ccb08d34b_b.jpg)

事实上呢？并不一定就是这样。为什么这么说呢？

这其中的道道非常的深，咱们就说`flex:1`吧，它相当于：

```
flex-grow: 1;
flex-shrink: 1;
flex-basis: 0%;
```

如果未显式设置`flex`（它是`flex-grow`、`flex-shrink` 和 `flex-basis`的简写属性）时，其初始值是：

```
flex-grow: 0;
flex-shrink: 1;
flex-basis: auto;
```

当`flex-basis` 为 `auto` 时，Flex项目的宽度是`max-content`。也就是说，`flex:1`时，`flex-basis`变成了`0%`，这将覆盖Flex项目的内在尺寸（`max-content`），Flex项目的基本尺寸现在是 `0`，但由于 `flex-grow`的存在，它们都可以增长以填补空的空间（Flexbox的剩余空间）。而实际上，在这种情况下，`flex-shrink`不再做任何事情，因为所有的Flex项目现在的宽度都是`0`，并且正在增长以填补可用空间。只不过，Flexbox容器有可有没有剩余空间，甚至是有不足空间。这个时候，`flex:1`也就不能均分Flexbox容器了。比如：

正如上面录屏所示，最的一个Flex项目宽度要更大，它的`max-content`都比其他Flex项目大（它有四个汉字宽）：

![](https://pic4.zhimg.com/v2-caaa59670706d31401de3cdf58124f03_b.jpg)

事实上就是触发了`flex`的边缘情况，如果你阅读W3C规范足够仔细的话，不难发现。[因为W3C规范中已有明确的描述](https://www.w3.org/TR/css-flexbox-1/)：

> By default, flex items won’t shrink below their minimum content size (the length of the longest word or fixed-size element). To change this, set the min-width or min-height property.

大致意思是说：“**默认情况下，弹性Flex项目（设置为`flex:1`的Flex项目）在收缩的时候，其宽度不会小于其最小内容尺寸（即 `min-width`，也就是`max-content`或固定尺寸元素的长度）。要改变这一点，需要显式设置`min-width`或`min-height`的值**”。

这一环扣一环，它会涉及`min-width`或`min-height`的值。默认情况下，`min-width`（或`min-height`）的值为 `auto`，它会被计算为 `0`。当一个元素为Flex项目时，`min-width`或`min-height`的值又不会被计算为`0`，它的值为`max-content`。这就是会触发边缘的计算。

为此，要真正达到均分列，只显式设置`flex:1`还不行，还需要在Flex项目上显式设置`min-width`的值为`0`：

```
.item {
    flex: 1;
    min-width: 0;
}
```

![](https://pic4.zhimg.com/v2-c5c32be4bc07776b3853404e13cd3f13_b.jpg)

> 这里涉及 CSS 多个方面的知识点，比如说，[CSS中的内在尺寸和外在尺寸、CSS的尺寸](https://www.w3cplus.com/css/css-intrinsic-and-extrinsic-sizing.html)、ref="[https://www.w3cplus.com/css/auto-value-in-css.html](https://www.w3cplus.com/css/auto-value-in-css.html)">CSS的auto计算 等。

不过，在使用`flex:1`的时候，需要额外的注意，因为`flex:1`时，这个`1`会被视为`flex-grow`的值为`1`。更好的使用姿势是，显式给`flex`设置三个值，比如`flex: 1 1 0%` 或 `flex: 1 1 100%`。

```
.item {
    flex: 1 1 0%;
    min-width: 0;
}
```

如果你有接触过 CSS Grid 布局的话，可能已经知道 CSS Grid 中独有的 `fr` 单位了。也能将网格容器均分，比如下面这个，将网格容器均分成五等份：

```
.grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
}
```

但要真正达到均分，也存在像Flex项目的边缘情况。也就是说，要在Grid项目上显式设置`min-width`为`0`：

See the Pen <a href="[https://codepen.io/airen/pen/QWqJpYJ](https://codepen.io/airen/pen/QWqJpYJ)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

有关于这方面更详细的介绍，还可以移步阅读 [@KevinJPowell](https://twitter.com/KevinJPowell) 的《[Equal Columns With Flexbox: It’s More Complicated Than You Might Think](https://css-tricks.com/equal-columns-with-flexbox-its-more-complicated-than-you-might-think/)》。

> 如果你对 CSS Grid 布局感兴趣的话，可以阅读《[2022年不能再错过 CSS 网格布局了](https://www.w3cplus.com/css/css-grid-tutorial-collection.html)》中所列的网格系列教程。

### Flexbox 中的最小值 `min-size`

在使用 Flexbox 布局的时候，很有可能其中某个 Flex 项目的文本内容很长，最终导致内容溢出。

![](https://pic3.zhimg.com/v2-db3183b955b9a579f6dd05ce3ad611d6_b.jpg)

你可能想到了在文本节点容器（它也是一个Flex项目）上设置：

```
/* ① 长单词断行，常用西文 */
.long-word {
    overflow-wrap: break-word;
}

/* ② 文本截取，末尾添加 ... */
.text-overflow {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ③ 多行文本截取，末尾添加... */

.line-clamp {
    --line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: var(--line-clamp);
    -webkit-box-orient: vertical;
}
```

诸如此类的操作，我们只是希望防止长内容（或长单词破坏掉页面布局）。如下图所示：

![](https://pic1.zhimg.com/v2-cf9807a0f6284c3b4e7bcf150b2cf114_b.jpg)

设计师希望卡片标题在同一行，不能因为内容过长而让设计效果失去一致性。为此，我们可以使用上面代码 ② 来截取文本，并且在文本末尾出现三个点的省略号：

```
.text-overflow {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

或者输入了恶意的内容，比如带下划线的URL或没有空格的数字，字母等：

![](https://pic3.zhimg.com/v2-910e4ac428e75aa82277a1458548aab2_b.jpg)

在这样的布局中，即使我们的标题元素是一个Flex项目，并且已显式设置了`flex`：

```
.card__title {
    flex: 1 1 0%;
}
```

你会发现，卡片右侧的Icon还是被长内容挤出容器（溢出）：

![](https://pic2.zhimg.com/v2-a4cda55fe3dd24876ec13c0c5fa794dd_b.jpg)

你可能会想到，使用上面代码 ① 让长词断行显示：

```
.long-word {
    overflow-wrap: break-word;
}
```

你会发现，并未起效果：

![](https://pic4.zhimg.com/v2-844ff3e52b92c6d40b61f2c5ca182f73_b.jpg)

> 即使你加了 `hyphens` 为 `auto` 也未生效。

你可能会认为他是一个Flexbox中的Bug，事实上，[W3C规范中也有相应的描述](https://www.w3.org/TR/css-flexbox-1/%23min-size-auto)：

> On a flex item whose `overflow` is `visible` in the main axis, when specified on the flex item’s main-axis `min-size` property, specifies an automatic minimum size.

大致意思上说：“ **主轴上Flex项目的`overflow`属性是`visible`时，主轴上Flex项目的最小尺寸（`min-size`）将会[指定一个自动的（automatic）最小尺寸](https://www.w3.org/TR/css-sizing-3/%23automatic-minimum-size)** ”。前面我们也提到过：

> 默认情况下，弹性Flex项目（设置为`flex:1`的Flex项目）在收缩的时候，其宽度不会小于其最小内容尺寸（即 `min-width`，也就是`max-content`或固定尺寸元素的长度）。要改变这一点，需要显式设置`min-width`或`min-height`的值。

因此，我们要解决这个问题，需要在使用`overflow-wrap`为`break-word`的地方重置`min-width`值，并且强制它变成`0`：

```
.long-word {
    overflow-wrap: break-word;
    min-width: 0;
}
```

另外，要提出的是，Flex项目的 `overflow` 的值为 `visible` 以外的值时会导致 `min-width` 的值为`0`，这就是为什么在方法 ② 中做文本截取的时候，怎么没有 `min-width: 0`。

> Web 中的长文本断行（Line Breaking）也是一个复杂的体系，涉及到的 CSS 属性也较多，比如 `white-space`、`overflow-wrap`、`hyphens` 、`word-break` 和 `line-break` 等。W3C 的 **[CSS Text Module Level 3](https://www.w3.org/TR/css-text-3/)** 对这些属性有详细的定义和描述。另外推荐大家阅读 [@frivoal](https://twitter.com/frivoal/) 曾经分享过的一个这方面的主题《[line breaking](https://florian.rivoal.net/talks/line-breaking/short%23cover)》。

继续回到这个话题上来，Flex项目的长文本（`max-content`）或显式设置 `white-space: nowrap` 在视觉上除了会打破布局之外，也会对相邻的 Flex项目进行挤压，即使这些Flex项目显式设置了尺寸。比如上面的示例：

```
.card__media {
    width: 4em;
    aspect-ratio: 1;
}

.card__action {
    width: 3em;
    aspect-ratio: 1;
}
```

你会发现，后面三张卡片的左右两侧的Flex项目尺寸被挤压，甚至还会造成视觉上的变形：

![](https://pic4.zhimg.com/v2-bfabd07d40f7aba724ac5ec45a8f65e3_b.jpg)

造成这个现象是由于标题（它也是一个Flex项目）内容过长（`max-content`），Flexbox容器无剩余空间来放置它，这个时候将会对同一轴上的其他 Flex 项目进行挤压。大家知道，Flex项目的`flex`的默认值为：

```
flex-grow: 0;
flex-shrink: 1;
flex-basis: auto;
```

`flex-shrink`的值为`1`，表示Flex项目可以被收缩。解决这种现象，我们有两种方法，最简单的方法是在标题这个 Flex项目元素上显式设置 `min-width` 的值为 `0`：

```
.card__title {
    min-width: 0;
}
```

另一种解法是在显式设置了 `width` 或 `height` 的 Flex项目上重置 `flex-shrink` 的值为 `0`，告诉浏览器，即使Flexbox容器没有足够的剩余空间，你也不能来挤压我的空间：

```
.card__media,
.card__action {
    flex-shrink: 0;
}
```

![](https://pic1.zhimg.com/v2-05e8a213d516e58d1feeab216ade6434_b.jpg)

相对而言，或者一劳永逸的方案是 **在显式设置了 `flex: 1` 的 Flex 项目是显式设置 `min-width` 的值为 `0`** 。

See the Pen <a href="[https://codepen.io/airen/pen/ZEXmNzd](https://codepen.io/airen/pen/ZEXmNzd)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

### Flexbox 中的滚动失效

记得在 2019 年做双十一盖楼的互动项目时，就踩过这个坑。项目中需要完成下图这样的一个需求：

![](https://pic2.zhimg.com/v2-77e4af86c1ae8e076c769dae97df3cb9_b.jpg)

**图中红色虚线框中的内容是带有滚动的**。 因为容器的高度是固定的（`100vh`），内容很有可能会超过容器的高度。

还原这个组件UI和交互的时候，同样采首子 Flexbox 来布局，我在滚动容器上显式设置了 `flex`为`1`：

![](https://pic4.zhimg.com/v2-9d635fa5410adfc577fe7d3b8a192b03_b.jpg)

在滚动容器上显式设置了 `overflow-y` 为 `scroll` 也未生效（当时发现这个Bug的是在iOS系统中）。后来才发现，这只是触发了Flex项目的边缘情况。当然，实现这个需求，他对HTML结构是有一定的要求的：

![](https://pic2.zhimg.com/v2-059590cee0c0ece49ccc18fb1b0076ed_b.jpg)

对应上图结构图的 HTML 代码如下：

```
<div class="main-container"> <!-- flex-direction: column -->
    <div class="fixed-container">Fixed Container</div> <!-- height: 100px; -->
    <div class="content-wrapper"> <!--  min-height: 0; -->
        <div class="overflow-container">
            <div class="overflow-content">
            Overflow Content
            </div>
        </div>
    </div>
</div>
```

关键的 CSS 代码：

```
.main-container {
    display: flex;
    flex-direction: column;
}

.fixed-container {
    height: 100px;
}

.content-wrapper {
    display: flex;
    flex: 1;
    min-height: 0; /* 这个很重要*/
}

.overflow-container {
    flex: 1;
    overflow-y: auto;
}
```

![](https://pic1.zhimg.com/v2-b620ee040d836e191cc0846408586020_b.jpg)

具体示例效果如下：

See the Pen <a href="[https://codepen.io/airen/pen/KKKGeRO](https://codepen.io/airen/pen/KKKGeRO)"> Overflow And Flex</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

关键部分是 **设置了 `flex: 1` 的 Flex 项目需要显式设置 `min-height` 的值为 `0` ，即滚动容器的父元素**。这其实是 Flexbox 布局的一个边缘情况。

> **注意，在设置了 `flex:1` 的 Flex 项目中应该尽可能的重置它的 `min-size` 值（当主轴在水平方向时（`flex-direction: row`），设置`min-width`，当主轴在垂直方向时（`flex-direction: column`），设置`min-height`），一般情况下都将其重置为 `0`。**  

另一个至Flexbox布局中滚动失效是 `flex-end`。这个案例我自己没有碰到过，也未曾测试过这种场景。我也是前段时间看到 @张旭鑫 老师的 《[flex-end为什么overflow无法滚动及解决方法](https://www.zhangxinxu.com/wordpress/2021/12/flex-end-overflow/)》文章才知道。简单地来看一下这个案例。

```
<!-- HTML -->
<Container>
    <Card />
    <Card />
    <Card />
    <Card />
</Container>

/* CSS */
.container {
    display: flex;
}

.container--row {
    overflow-x: scroll;
}

.container--column {
    flex-direction: column;
    overflow-y: scroll;
}
```

这是正常情况之下，没有使用任何对齐方式相关的属性，比如 `justify-content`。整个效果如下：

> 为了让滚动体验更接近原生客户端，示例对滚动做了一些优化，比如在滚动容器中使用了 `overscroll-behavior` 和 滚动捕捉相关的特性。如果你对这方面感兴趣，可以阅读《[改变用户体验的滚动新特性](https://www.w3cplus.com/css/new-scroll-features-that-change-the-user-experience.html)》和《CSS滚动捕捉：[Part1](https://www.w3cplus.com/css/css-scroll-snap-part-1.html)和[Part2](https://www.w3cplus.com/css/css-scroll-snap-part-2.html)》。  

如果我们在滚动容器 `.container` 显式设置`justify-content`的值为`flex-end`：

```
.container {
    justify-content: flex-end;
}
```

这个时候滚动失效：

你可能会好奇，为什么会这样呢？

正如 @张旭鑫 老师的教程中所述。在 Web 中，我们的书写习惯和阅读模式是从左到右（LTR），从上到下。也就是说，一般情况之下（先不考虑其他的书写模式），水平方向内容向右溢出，垂直方向的内容向底部溢出，即 **滚动条在设计的时候，就约定了，只有容器下方（或右侧）内容有多余，才需要滚动**。

在滚动容器（它刚好是Flexbox容器）显式设置了`justify-content: flex-end`（主轴方向从`flex-start`换成了`flex-end`）。这就导致，**如果有内容是在上方或左侧超过容器的尺寸限制，滚动条是不会有任何变化的**。也因此，**滚动容器里面内容溢出容器的方向不是在容器的下方或者右侧，而是在容器的顶部和左侧，自然就无法触发滚动条的出现**。简单地说，`flex-end` 会让内容反向溢出，也就没有滚动条，自然也就无法滚动：

![](https://pic3.zhimg.com/v2-5ddbdfa16dda508e7dcafa0451908a0a_b.jpg)

在这种情况之下，想让滚动容器能正常滚动起来，其实很简单，借助 `margin: auto`即可。在Flex项目是显式设置`margin`的值为`auto`有着独特的效果，如下图所示：

![](https://pic1.zhimg.com/v2-4ed30f1ed5e233c941b5ef8201f1e4b0_b.jpg)

解决方法很简单，对齐方式开始默认的对齐，即 `justify-content`不设置为`flex-end`，取默认值，然后使用 `margin: auto` 实现类似`justify-content: flex-end`对齐效果。在我们的示例中，只需要给第一个Flex项目设置`margin-left`（水平方向）或 `margin-top`（垂直方向）的值为`auto`：

```
.container--row .card:first-child {
    margin-left: auto;
}

.container--column .card:first-child {
    margin-top: auto;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/VwMqepY](https://codepen.io/airen/pen/VwMqepY)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

点击示例中的按钮动态增加卡片：

### 与 Grid 布局相关的防御式 CSS

CSS Grid 是目前 Web 中唯一一种二维布局技术。它已经得到了现代主流浏览器的支持，在 2021 年我花将近半年时间，[用了二十多篇篇幅来阐述 CSS Grid 布局的基础知识和相关应用](https://www.w3cplus.com/css/css-grid-tutorial-collection.html)，再次感受到她的强大之处。

说实话，她很强大，但也很复杂。当然，她也有很多不怎么为人所知的一面。早在 2019 年 [@Manuel Matuzović](https://twitter.com/mmatuzo) 用了一个系列（目前完成了[Part1](https://www.matuzo.at/blog/the-dark-side-of-the-grid/) 和 [Part2](https://www.matuzo.at/blog/the-dark-side-of-the-grid-part-2/)，还有一些未完成 ）阐述 CSS Grid 布局中一些不为人知的事情。

![](https://pic4.zhimg.com/v2-ec95d98621477fe7d0d34f080f018f33_b.jpg)

但这些并不是我们今天要探讨的。我们主要来聊聊使用 CSS Grid 时应该怎么编写 CSS 才更具防御性。

### grid 还是 inline-grid

`grid` 和 `inline-grid` 也是 `display` 的属性，他们和有面所介绍的 `flex` 和 `inline-flex` 有点相似。`grid` 和 `inline-grid` 都是用来显式声明网格容器的，即创建网格格式化上下文（GFC），这两者不同之处是：

-   `grid` 创建的网格容器是块盒，网格容器的宽度和父容器宽度相等（前提是父容器未做别的格式化上下文处理）
-   `inline-grid` 创建的网格容器是内联盒子，网格容器的宽度将由其具有最大宽度（`max-content`）的子元素（网格项目）来决定

即：

```
.block-container {
    display: grid;

    /*相当于*/
    display: block grid;
}

.inline-container {
    display: inline-grid;
    /* 相当于 */
    display: inline grid;
}
```

但它们和Flexbox 中的 `flex`以及 `inline-flex` 有着明显的区别：

-   Flexbox 布局中，不管是 `flex` 还是 `inline-flex`，默认情况下，都会让所有 Flex 项目排在主轴上（一行或一列）
-   Grid 布局中，不管是 `grid` 还是 `inline-grid`，默认情况下，都不会改变 Grid 项目的排列方式，将按照 HTML 结构中的源顺序排列，除非你在声明网格容器的时候，显式使用 `grid-template-*`（比如，`grid-template-columns`、`grid-template-rows` 或 `grid-template-areas`）改变其排列方式

![](https://pic2.zhimg.com/v2-f38034fedd7f3f7d3d0d0cec6f2f8271_b.jpg)

> **在 CSS Grid 中，如果不使用 `grid-template-*` 显式定义网格轨道，那么不管 `display` 的值是 `grid` 还是 `inline-grid` ，他都是以 HTML 的源顺序渲染** ！  

### 注意网格轨道的固定值

CSS Grid 网格轨道的定我方式有很多种，除了显式使用 `grid-template-*` 属性定义网格轨道之外，还可以使用 `grid-*`（比如`grid-row`、`grid-column`或`grid-area`）根据网格线编号（或名称）、网格区域名称定义。除此之外，轨道尺寸设置方式也非常灵活，比如：

-   带有不同单位的长度值，如 `px`、`em`、`rem`、`%`、`vw`等，还有网格布局中独有的单位 `fr`
-   关键词，比如 `none`、`auto`、`min-content`和`max-content`
-   CSS 函数，比如 `fit-content()`、`minmax()`、`repeat()`、`min()`、`max()`和`clamp()`等

因此，为了让你的 CSS Grid 更为灵活（适应性更强），在定义网格轨道的时候，应该尽可能的使用内在尺寸，即 使用关键词和CSS的函数。用一个常见的布局案例（比如 [Medium](https://medium.com/) ）来阐述。

![](https://pic1.zhimg.com/v2-17d0747b9325e9984c53455aa6ff748c_b.jpg)

CSS 中实现上图布局效果的方案有很多种，最简单地：

```
.container {
    padding-left: 20px;
    padding-right: 20px;
    width: 100%;
    max-width: 60ch;
    margin-left: auto;
    margin-right: auto;
}

.container--full {
    width: 100%;
}
```

这种方案简单，但对结构有一定的要求。如果我们使用 CSS Grid ，会变得更为灵活，比如像下面这样：

```
:root {
    --gap: 20px;
    --minWidth: 60ch;
}

.container {
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr min(var(--minWidth), calc(100% - var(--gap) * 2)) 1fr;
}

.container > * {
    grid-column: 2;
}

.container > .full {
    grid-column: 1 / -1;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/wvrOgMQ](https://codepen.io/airen/pen/wvrOgMQ)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

尝试着调整示例中的间距和居中内容的宽度，或者调整浏览器视窗的宽度，你将看到像下面这样的效果：

如果你把示例中的 `min()` 函数换成 `clamp()` 函数的话，还可以在一个区间中选值，比如内容容器的宽度在 `23ch ~ 65ch` 之间：

![](https://pic2.zhimg.com/v2-f6d346120a32943bdf88940b62a014c5_b.jpg)

```
.container { 
    --limit-max-container-width: 65ch; 
    --limit-min-container-width: 23ch; 
    --gutter: 1rem; 
    display: grid; 
    grid-template-columns: 1fr clamp( 
        var(--limit-min-container-width), 
        100% - var(--gutter) * 2, 
        var(--limit-max-container-width) ) 1fr; 
    gap: var(--gutter); 
}
```

你也可以将 `min()` 和 `minmax()` 结合起来使用：

```
.container { 
    --limit-max-container-width: 65ch; 
    --limit-min-container-width: 23ch; 
    --gutter: 1rem; 
    display: grid; 
    grid-template-columns: 1fr minmax(min(var(--limit-min-container-width), 100% - var(--gutter) * 2), var(--limit-max-container-width)) 1fr; 
    gap: var(--gutter); 
}
```

See the Pen <a href="[https://codepen.io/airen/pen/yLzwbBj](https://codepen.io/airen/pen/yLzwbBj)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

再来看一个 PC 端常见的两列布局，即 **则边栏固定宽度，主内容区域自适应**。

![](https://pic4.zhimg.com/v2-4ec087752ab5f3f4c3b15e9ca71298c3_b.jpg)

如果使用 CSS Grid 来布局的话，通常会像下面这样：

```
.container {
    display: grid;
    gap: 1rem;
    grid-template-columns: 250px 1fr;
    grid-template-areas: "sidebar "main";
}
```

但是，如果浏览器的视窗尺寸较小，有可能因为缺少足够的空间导致样式出现问题。为了避免这种情况发生，通常会在 CSS Grid 布局中使用媒体查询：

```
.container {
    display: grid;
    gap: 1rem;
    grid-template-areas: 
        "sidebar"
        "main";
}

@media (min-width: 760px) {
    .container {
        grid-template-columns: 250px 1fr;
        grid-template-areas: "sidebar main";
    }
}
```

See the Pen <a href="[https://codepen.io/airen/pen/XWeGRgQ](https://codepen.io/airen/pen/XWeGRgQ)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

改变浏览器视窗的大小，效果如下：

![](https://pic1.zhimg.com/v2-349c74495d65ed8fa8b6a9147ea3f604_b.jpg)

上面这个示例我们还可以进一步的让侧边栏宽度更为灵活。在定义侧边栏尺寸的时候，可以使用 `fit-content()` 函数，把 `grid-template-columns: 250px 1fr;` 换成：

```
.container {
    grid-template-columns: fit-content(250px) 1fr;
}
```

代码中的 `fit-content(250px)` 相当于 `min(max-content-size, max(min-content, 250px))`。其中：

-   ①：`max()`函数的参数是 `min-content`（第一个参数） 和 `250px`（第二个参数），而 `max()` 函数是会返回两个参数中较大的一个值
-   ②：`max()`返回值会放到 `min()` 函数中，即 `max()` 返回的值变成了 `min()` 函数的第二个值，它会和最大的内容尺寸（`max-content-size`）进行比较，这是由于网格限制而产生的实际宽度，但最大为 `max-content`。`min()` 函数和 `max()` 类似，只不过它返回的是更小的值

因此，`fit-content(250px)` 用下面这个公式来描述更适合：

```
fit-content(200px) = min(min(max-content, available-size), max(min-content, 200px))
```

公式中的 `available-size` 指的是网格中的可用宽度。

除此之外，规范中还提供了另一种公式来描述 fit-content():

```
fit-content(<length-percentage>) = max(minimum, min(limit, max-content))
```

其中：

-   ①：`minimum` 代表自动最小值（通常但不总是等于`min-content`最小值）
-   ②：`limit` 是作为参数传给 `fit-content()` 参数，即 `<length-percentage>`，比如示例中的 `250px`
-   ③：`min()` 返回 `limit` 和 `max-content` 中更小的值，比如这个示例，`min()` 返回的是 `250px` 和 `max-content` 更小的一个
-   ④：`max()` 返回是 `minimum` 和 `min(limit, max-content)` 两个值中更大的一个

如果上面的描述不易于理解的话，我们可以这样来理解。比如示例中的 `fit-content(250px)`，表示该列网格轨道宽度不会超过 `250px`，并且可以在内容很短的情况下缩小到 `250px` 以下。

See the Pen <a href="[https://codepen.io/airen/pen/KKXEmOE](https://codepen.io/airen/pen/KKXEmOE)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

使用`fit-content()`前面的效果对比：

![](https://pic3.zhimg.com/v2-ad1bc2716d89f1486f22864bf504cff2_b.jpg)

> 简单地说，**在 CSS Grid 布局中，定义网格轨道尺寸时，尽可能的不要使用外在尺寸（比如设置固定的长度值`<length>`），应该尽可能的使用内在尺寸（比如 `min-content`）。即使不使用内在尺寸，也应尽可能的结合CSS的函数（比如`min()`、`max()`和`clamp()`等），来提高网格轨道尺寸的灵活性和自适应性**！  

如果你想更深入的了解示例中用到的 CSS 特性，可以移步阅读：

-   [CSS 的值和单位](https://www.w3cplus.com/css/css-values-and-units.html)
-   [元素尺寸的设置](https://www.w3cplus.com/css/css-intrinsic-and-extrinsic-sizing.html)
-   [使用内在尺寸定义网格轨道尺寸](https://www.w3cplus.com/css/css-grid-tutorial-collection.html)
-   [网格轨道尺寸的设置](https://www.w3cplus.com/css/grid-layout-part-3.html)
-   [CSS Grid: minmax()](https://link.zhihu.com/?target=h%3Ccode%3Ettps%3A//w%3C/code%3Eww.w3cplus.com/css/grid-layout-part-5.html)
-   [CSS Grid: min-content和max-content](https://link.zhihu.com/?target=h%3Ccode%3Ettps%3A//www.%3C/code%3Ew%3Ccode%3E3cplus.com/%3C/code%3Ecss/grid-layout-part-4.html)
-   [聊聊min()，max()和clamp()函数](https://www.w3cplus.com/css/min-max-clamp-function.html)
-   [网格中的可用函数](https://www.w3cplus.com/css/grid-layout-part-5.html)
-   [2022年不能再错过 CSS 网格布局了](https://www.w3cplus.com/css/css-grid-tutorial-collection.html)

### 网格中的断行

> 首先声明，这里所说的断行不是指文本的或词的断行。  

前面提到过，在 Flexbox 布局中，如果要让布局断行，需要在 Flexbox 容器上显式设置 `flex-wrap` 为 `wrap`。

```
.cards {
    --gap: 18px;
    --columns: 3;
    --min-width: 220px;

    display: flex;
    flex-wrap: wrap;
    gap: var(--gap);
}

.card {
    flex: 1 1 calc((100% - var(--gap) * (var(--columns) - 1)) / var(--columns));
    min-width: var(--min-width);
}
```

See the Pen <a href="[https://codepen.io/airen/pen/XWeGaNV](https://codepen.io/airen/pen/XWeGaNV)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

通过改变间距、列数和卡片最小宽度或者容器尺寸，都能自动调整 UI 的布局效果：

![](https://pic2.zhimg.com/v2-19619bd60cd8d16a9e0ac8d212a5d2e1_b.jpg)

不过该方案存在一定的缺陷，**当卡片数量不是列数的倍数时，最后一排卡片宽度会像下面这个视频效果一样变化**：

![](https://pic2.zhimg.com/v2-19619bd60cd8d16a9e0ac8d212a5d2e1_b.jpg)

虽然解决方案有很多种（可以阅读 @张旭鑫 老师的 《[让CSS flex布局最后一行列表左对齐的N种方法](https://www.zhangxinxu.com/wordpress/2019/08/css-flex-last-align/)》一文），只不过与 CSS Grid 相比，灵活度要欠缺很多。

在 CSS Grid 布局中，对于上面示例布局场景（称之为断行）是具有天然性的。只需要在定义网格轨道的时候，在 `repeat()` 函数中使用 `auto-fill` 或 `auto-fit` 关键词。

-   `auto-fill` ：如果网格容器在相关轴上具有确定的大小或最大大小，则重复次数是最大可能的正整数，不会导致网格溢出其网格容器。如果定义了，将每个轨道视为其最大轨道尺寸大小函数 ( `grid-template-rows` 或 `grid-template-columns` 用于定义的每个独立值。 否则，作为最小轨道尺寸函数，将网格间隙加入计算. 如果重复次数过多，那么重复值是 `1` 。否则，如果网格容器在相关轴上具有确定的最小尺寸，重复次数是满足该最低要求的可能的最小正整数。 否则，指定的轨道列表仅重复一次。
-   `auto-fit` ： 行为与 `auto-fill` 相同，除了放置网格项目后，所有空的重复轨道都将折叠。空轨道是指没有流入网格或跨越网格的网格项目。（如果所有轨道都为空，则可能导致所有轨道被折叠。）折叠的轨道被视为具有单个固定轨道大小函数为 `0px`，两侧的槽都折叠了。为了找到自动重复的轨道数，用户代理将轨道大小限制为用户代理指定的值（例如 `1px`），以避免被零除。

简单地说，`auto-fit` 将扩展网格项目以填补可用空间，而`auto-fill`不会扩展网格项目。相反，`auto-fill`将保留可用的空间，而不改变网格项目的宽度。比如下图，可以看出 `auto-fit` 和 `auto-fill` 的差异：

![](https://pic3.zhimg.com/v2-127d034c297703e4bdf592555fe582aa_b.jpg)

再来看一张 `auto-fit` 和 `auto-fill` 的对比图，即，在网格容器中有多个和仅有一个网格项目时，使用`auto-fill` 与 `auto-fit` 的差异：

![](https://pic3.zhimg.com/v2-6a5f35c70d297bbf246cba52da3205be_b.jpg)

我们可以使用这个特性来改造前面的 Flexbox 换行的示例：

```
.cards {
    --gap: 18px;
    --min-width: 220px;

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--min-width), 1fr));
    gap: var(--gap);
}
```

See the Pen <a href="[https://codepen.io/airen/pen/mdBoBaM](https://codepen.io/airen/pen/mdBoBaM)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

调整示例中的间距或卡片最小宽度或者改变网格容器的尺寸，你看到的效果如下：

![](https://pic2.zhimg.com/v2-3435d099fd88913fa283a92f654883a5_b.jpg)

或许你已经发现了，上面这个示例还存在一个小缺陷，**当网格容器的宽度小于卡片的最小宽度时，网格容器会出现滚动条，或者说卡片被截取**。为了让布局的灵活性，可防御性更强，我们可以在 `minmax()` 函数中使用`min()`，并且给 `min()`函数传入 `var(--min-width)` 和 `100%` 两个值。我们知道，`100%` 是相对于其父容器宽度来计算的，而且 `min()` 函数会取更小的那个值，也就是说，当网格容器小于一定值的值，`min()` 函数会到 `100%` 这个值，即与其父容器宽度相等：

```
.cards {
    --gap: 18px;
    --min-width: 220px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--min-width), 100%), 1fr));

    gap: var(--gap);
}
```

See the Pen <a href="[https://codepen.io/airen/pen/qBPvVZR](https://codepen.io/airen/pen/qBPvVZR)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

拖动示例中网格容器右下角滑块，当网格容器宽度小于 `--min-width` 也会自动调整 UI 的布局，卡片不会被容器截取或容器出现滚动条：

![](https://pic2.zhimg.com/v2-9b0fff9542abf3459effe05aee270789_b.jpg)

当然，容器小到无法容纳内容时，UI 看上去还是不美的。如果你对容器宽度有一个预判，比如说，网格容器小到一定的时候就不能再小了，可以在网格容器上使用 `min-width` 来设置一个值，比如：

```
.section {
    min-width: 180px;
}
```

你可能已经感受到其强大和灵活性了，在这样的卡片布局场景，都可以不依赖任何 CSS 媒体查询，就可以实现响应式的布局效果。

> 有关于 CSS Grid 中 `auto-fit` 和 `auto-fill` 更详细的介绍，可以移步阅读《[CSS Grid: 网格中的函数](https://www.w3cplus.com/css/grid-layout-part-5.html)》一文。  

### 网格中的最小宽度

与 Flexbox 布局类似，CSS Grid 中的子元素（网格项目）内容的默认最小值是 `auto`。也就是说，如果元素的尺寸超过网格项目，同样会发生内容溢出。

![](https://pic2.zhimg.com/v2-ab3409e62145db396595b7c6915726d9_b.jpg)

正如上图所示，内容区域（Main）包含了一个具有轮播功有的走马灯（Carousel）。HTML和CSS代码如下所示：

```
<!-- HTML -->
<div class="wrapper">
    <main>
        <section class="carousel"></section>
    </main>
    <aside></aside>
</div>

/* CSS */
@media (min-width: 1020px) {
    .wrapper {
        display: grid;
        grid-template-columns: 1fr 248px;
        grid-gap: 40px;
    }
}

.carousel {
    display: flex;
    overflow-x: auto;
}
```

由于 Carousel 是一个不会发生断行的 Flexbox 容器，它的宽度超过了主内容区域（Main），而网格项目了会遵循这一点。因此，出现了水平滚动条。针对这个问题，有三种不同的解决方案：

-   使用 `minmax()` 函数
-   显式在网格项目上设置 `min-width`
-   显式在网格项目上设置 `overflow: hidden`

做为一种防御性 CSS 机制，我选择了第一种，使用 `minmax()` 函数：

```
@media (min-width: 1020px) {
    .wrapper {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 248px;
        grid-gap: 40px;
    }
}
```

![](https://pic4.zhimg.com/v2-2339974291a7a62c2bd9c62472599057_b.jpg)

CSS Grid 布局有一个独有的计算长度的单位，那就是 `fr` 单位，可以将其与`%`结合起来理解。简单地说：

> **`1`个`fr`（即`1fr`）就是`100%`网格容器可用空间；`2`个`fr`（即`2fr`）是各`50%`网格容器可用空间，即`1fr`是`50%`网格容器可用空间。以此类似，要是你有`25`个`fr`（即`25fr`），那么每个`fr`（`1fr`）就是`1/25`或`4`%**。  

我们可以使用饼图来描述网格的 `fr` 单位：

![](https://pic4.zhimg.com/v2-15e475591c494453a6c274cf143b4cfb_b.jpg)

**注意，一个饼图（圆）就相当于网格容器的可用空间，分割的份数就相当于设置了弹性系数的网格轨道**。

在 CSS Grid 中，我们可以使用 `fr` 来做均分效果，类似于 Flexbox 中的 `flex:1`。只不过，在使用 `fr` 做均分列的时，需要在相应的网格项目中显式设置 `min-width` 的值为 `0`。

### 网格布局中的 position: sticky

[CSS Positioned Layout Module Level 3](https://www.w3.org/TR/css-position-3/%23position-property) 中的 `position` 新增了 `sticky` 属性，从表现形式来看，它是 `relative` 和 `fixed` 的结合物，即默认情况表现形式像`relative`，但达到一定条件，它的表现形式又类似于 `fixed`。不过在 CSS Grid 布局中给网格项目（Grid Item）设置`position` 为 `sticky`时，他的渲染行为和你理解的或者说非网格项目的渲染行为有所差异。

有接触过 CSS Grid 布局的同学都应该知道，默认情况下，网格项目是 Stretch（拉伸的）。正如前面介绍 `fit-content()` 示例所示，`<aside>` 和 `<main>` 两个网格项目的高度和网格容器的高度等同（即使没有足够多的内容来撑高）：

![](https://pic4.zhimg.com/v2-44c89060ddaeb271b1ba2eb4e451ef17_b.jpg)

而我们所理解的 `position`，在非`static`值的下，他都会脱离文档流，最直观的效果就是在没显式设置尺寸情况之下，它的大小由内容的大小来决定。换句话说，如果在网格项目上显式设置`position`为`sticky`，想让其表现形式如我们所期望的那样，就需要显式地在该网格项目上设置 `align-self`的值为 `start`：

```
aside {
    align-self: start;
    position: sticky;
    top: 0;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/poWYLgX](https://codepen.io/airen/pen/poWYLgX)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

具体效果如下所示：

![](https://pic2.zhimg.com/v2-08cccf1c201cb5cddce90260062d7b29_b.jpg)

### 间距

一直以来，给元素与元素之间设置间距，都习惯性的使用 `margin` 或 `padding`，但在很多时候，`margin` 和 `padding` 并不是很灵活，特别是在 Flexbox 和 Grid 布局中。在 Flexbox 和 Grid 布局中，使用 `gap` 来设置项目之间的间距会比 `margin` 要灵活：

![](https://pic1.zhimg.com/v2-02169b759d6a916fc90760c7883f2aa0_b.jpg)

正如上图所示，如果Flex项目或Grid项目与容器之间是零间距，便项目与项目之间有一定的间距，那么使用 `gap` 是最佳的。

```
.flex--container {
    display: flex;
    gap: 20px;
}

.grid--container {
    display: grid;
    gap: 20px;
}
```

一般情况来说，`gap` 能满足大部分场景，因为现在主流的布局技术是 Flexbox 或 Grid。只不过很多开发碍于 `gap` 的兼容性，特别是在非 Flexbox、Grid和多列的布局中，更多采用 `margin` 来设置元素与元素之间的间距。拿下面这些示例来说。

我们在开发的过程中需要考虑不同的内容长度。这意味着，空白间距应该添加到元素上，即使它看起来并不需要：

![](https://pic2.zhimg.com/v2-3a77c5bfe986f6a632b247e7b3aba5c5_b.jpg)

在这个例子中，左侧有一个标题，右侧有一个可操作的行动点（比如一个操作按钮）。在上图中来说，它效果起起来不错，但是当标题的字符变多了呢？

![](https://pic4.zhimg.com/v2-0a24b6c1746ae9604a8135a93c5cb887_b.jpg)

注意到了吗？标题和按钮之间离得太近了，甚至因标题内容过长会覆盖按钮区域。当然，你可能会像前面所介绍的内容那样，让文本折行或文本截断。但即使你这样设置了样式，但也应该在标题和按钮之间设置一个间距，这样做最起码可以让文本和按钮之间不会紧挨着。

```
.title {
    margin-right: 1rem;
}
```

![](https://pic2.zhimg.com/v2-b5ed98512a759811ca8cacf04d69b9dd_b.jpg)

注意，如果标题和按钮是Flex项目或Grid项目，那么在他们的父容器中显式设置`gap`会更佳。如果不是的话，我们更应该把`margin`设置在按钮元素上，这样做的好处是，不管按钮是否存在，都不会让标题有一个额外的间距存在：

```
.button {
    margin-left: 1rem;
}
```

除了像上面这样设置是间距之外，还可以使用 CSS 选择器相邻选择器（`+`）来设置`margin`：

```
.title + .button {
    margin-left: 1rem;
}
```

上面这个方式，特别适用于多个并排元素之间。比如像下图所示，有两个相邻的按钮，只是希望在按钮之间有一个间距：

![](https://pic1.zhimg.com/v2-b3b41b5514936707c20e92ba06d6bb38_b.jpg)

我们可以像下面这要来设置按钮之间的间距：

```
.button + .button {
    margin-left: 1rem;
}
```

它是说：“**如果一个按钮紧挨着另一个按钮，以防万一，给第二个按钮加一个`margin-left`**”。 事实上，在 Web 开发中，这样的场景特别的多。

![](https://pic4.zhimg.com/v2-c4da8018edd77e7a3b0bb6d077415b93_b.jpg)

可以采用相同的方式来设置间距：

```
.cards + .cards {
    margin-top: 20px;
}

.card + card {
    margin-left: 20px;
}
```

另外，在Web布局中，还有像下图这样的场景，会在容器中设置一个内距（`padding`），然后元素与元素之间设置一个`margin-bottom`，造成最后一个元素与容器之间的间距明显变大：

![](https://pic2.zhimg.com/v2-eae4acb956b6789985fc8473be10ec6d_b.jpg)

代码可能像下面这样写的：

```
.cards {
    padding: 20px;
}

.card {
    margin-bottom: 20px;
}
```

你可能会说，使用结构性伪类选择器，可以避免：

```
.cards {
    padding: 20px;
}

.card:not(:last-child) {
    margin-bottom: 20px;
}

/* 或者 */

.card:not(:first-child) {
    margin-top: 20px;
}
```

除此之外，采用相邻选择器会更好一点：

```
.cards {
    padding: 20px;
}

.card + .card {
    margin-top: 20px;
}
```

> **特别声明，最佳的还是`gap`。只不过，目前为止他只能用于 Flexbox 、Grid 和 多列布局中**。  

继续拿上面卡片为例。在每张卡片（`.card`）上可能会设置一定的`padding`值，但有的时候，可能会因为某个原因，卡片上的数据（内容）并没有正常的输出，那么输出的效果可能会像下面这样：

![](https://pic3.zhimg.com/v2-db5a18e3dbd6a38e562d11a1aff71342_b.jpg)

为了避免上图这种现象出现，我们可以使用伪类选择器`:empty` 将卡片的内距重置为`0`：

```
.card {
    padding: 12px;
}

.card:empty {
    padding: 0;
}
```

> 在 CSS 伪类选择器中，除了`:empty` 之外，还有一个与其类似的伪类选择器 `:blank`，只不过到目前为止，支持`:blank`的选择器非常少。如果你对这两个选择器感兴趣，请移步阅读《[CSS伪类选择器：:empty vs. :blank](https://link.zhihu.com/?target=%3Ccode%3Ehttps%3A%3C/code%3E//www%3Ccode%3E.w3cpl%3C/code%3Eus.com/css/empty-vs-blank.html)》一文。  

我们重新回到 CSS Flexbox 和 CSS Grid 布局中来，在 Flexbox 和 Grid 布局中，除了 `gap`、`margin` 可以设置Flex项目或Grid项目之间的间距之外，还可以使用 **[CSS Box Alignment](https://ishadeed.com/article/learn-box-alignment/)** 来控制它们之间的间距：

![](https://pic2.zhimg.com/v2-aad6884da00862561e2a3e0f0c4dd799_b.jpg)

虽然说，使用 CSS Box Alignment 中的属性可以控制项目之间的间距，比如在 Flexbox 容器中，使用`justify-content` 将Flex项目彼此隔开，但这并不意味着，就是完美的。比如说，当Flex项目的数量固定时，布局看起来是没有问题的。但是，当Flex项目的个数增加或减少时，布局看起来就会变得非常奇怪。比如下图所示，Flexbox容器中有四个Flex项目，Flex项目之间的间距并不是由 `gap` 或 `margin` 来控制，而是由`justify-content` 的值来控制，比如 `space-between`：

```
.wrapper {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}
```

![](https://pic4.zhimg.com/v2-d473c06fc0a01de78bf27f962806aa07_b.jpg)

让我们来看其怪异的场景，比如Flex项目的数量少于`4`个时，它呈现给用户的效果如下：

![](https://pic1.zhimg.com/v2-b85abb4edbec7888c3281fab336524b4_b.jpg)

> 除了 `space-between` 之外，还有 `space-around` 和 `space-evenly` 有相似的现象。  

正如上图所示，在一些场景（Flex项目过少或过多），这要的效果都是不友好的，但我们可以通过以下几种方式进行处理：

-   `margin` 设置外边距（但需要一些额外的技巧，详细的可以阅读《[Flexbox gutters and negative margins, mostly solved](https://www.rawkblog.com/2019/01/flexbox-gutters-negative-margins-solved/%3Fspm%3Data.21736010.0.0.1f1c38eaoNTKyw)》一文）
-   在Flexbox容器（或Grid容器）上设置`gap`
-   增加空元素来占位

最为简单的是使用 `gap`：

```
.wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}
```

![](https://pic2.zhimg.com/v2-7ac8835ffe2163ee1b11318b01b857b1_b.jpg)

你是否留意过，前面介绍“Flexbox中的滚动失效”的示例中，虽然我们在滚动容器中显式设置了一个`padding`值，但在滚动容器中水平方向右侧和垂直方向底部的`padding`在视觉呈现过程中看似被丢失了：

![](https://pic4.zhimg.com/v2-a324c7c78e8db7ccb5632740a921a6df_b.jpg)

要避免这种现象，需要把运用于滚动容器上的 `padding` 换成 `border`：

```
.scroll-container {
    border: 20px solid transparent;
}
```

或者改变其 HTML 结构，在滚动容器外增加一层包裹元素：

```
<!-- HTML -->
<scroll-container-wrapper>
    <scroll-container>
    </scroll-container>
</scroll-container-wrapper>
```

并且把运用滚动容器的`padding`移到其包裹容器中：

```
scroll-container-wrapper {
    padding: 20px
}
```

![](https://pic1.zhimg.com/v2-bff1cff605b93ed024153e34dd04e2f4_b.jpg)

### 避免使用固定尺寸

很多 Web 开发者（特别对于经验不足的 Web 开发者）都喜欢在元素上显式设置`width`和`height`来控制尺寸。在一些 Low-Code 和 D2C（Design To Code）的应用上，这种现象更是很普遍。但稍微有一点经验的 Web 开发者都知道，显式在元素上设置 `width` 和 `height` 是最易于破坏布局的。

设计师给我们提供的设计稿，每个层（近似元素）都设置了 `width` 和 `height`值，而且效果是OK的。但在实际中，Web中的元素的内容并不像设计稿一样固定的，它是动态，而且具有不同长度。也就是说，在还原 UI 设计稿的时候，如果你根据设计稿的图层信息，给元素设置固定的尺寸（`width` 和 `height`），就会导致布局的破坏。例如下面这种情况：

![](https://pic1.zhimg.com/v2-b28a6ca67d085829cff6050472a688f8_b.jpg)

为了避免内容超出容器，我们需要使用 `min-height` 来替代 `height`：

```
.hero {
    min-height: 350px;
}
```

![](https://pic3.zhimg.com/v2-71ece957daf24d53df8b57482c42cc0e_b.jpg)

这样一来，当内容变得更多时，布局依旧是完美的（不会因内容变多而撑破）。

与其类似的是，给元素设置宽度的时候，也应该尽可能的使用 `min-width` 来替代 `width`。比如，在构建一个 `<Button>` 组件时，你可能曾碰到过因按钮中的文字与左右边缘间隙过小（在没有显式设置`padding`情况下），会选择性地在按钮上使用 `width` 设置固定值：

```
.button {
    width: 100px;
}
```

如果按钮里面的文字长度超过 `100px`，它将靠近按钮的左右边缘。如果再长一些，按钮文本就会超出其容器，也可能因此会打破布局，给用户的体验也较差。

![](https://pic3.zhimg.com/v2-418c4d0a017b505130ebd1b25362cf6e_b.jpg)

把 `width` 换成`min-width` 就不会出现这种现象了：

```
.button {
    min-width: 100px;
}
```

如果是在 Flexbox 或 Grid 布局中，更应该尽可能的设置固定的值，更好的方案是采用内在尺寸来定义元素的尺寸。

有关于这方面更多的介绍，还可以阅读：

-   [CSS Box Sizing Module Level 3](https://www.w3.org/TR/css-sizing-3/)
-   [元素尺寸的设置](https://www.w3cplus.com/css/css-intrinsic-and-extrinsic-sizing.html)
-   [Making Things Better: Redefining the Technical Possibilities of CSS](https://noti.st/rachelandrew/ClxWtN%23sU9ZMIz)
-   [Intrinsic Sizing In CSS](https://ishadeed.com/article/intrinsic-sizing-in-css/)
-   [How Big Is That Box? Understanding Sizing In CSS Layout](https://www.smashingmagazine.com/2018/01/understanding-sizing-css-layout/)

在 Web 开发过程中，我想你可能经历过这种情况。你有一个元素，在折叠和展开时，希望能够使用 CSS 的 `transition` 让其具有一定的动画效果，即平滑的折叠和展开。只不过，元素展开的大小需要取决于其内容。你可能会这样编写 CSS：

```
.panel {
    transition: height .2s ease-out;
}

.panel.collapsed {
    height: 0;
}
```

这样的代码，并没有过渡效果，只是两种尺寸之间的跳动。注意，引起这种现象，发生在元素开始和结束状态时`height`为`auto`。

![](https://pic3.zhimg.com/v2-169bdcb8e3717453de04316e5d1adfa2_b.jpg)

`height`值为其他单位，比如 `px`、`%`或其他绝对单位时都能如期工作。但在实际生产中，我们编码时，并无法预知元素的内容有多少，也就不知道其高度。换句话说，如果显式设置一个固定值，比如 `300px`，那么就有可能会因内容过多而撑破布局。

在 CSS 中，我们有一些方案可以避免这种现象出现：

-   使用一个合理的`max-height` 来替代 `height`
-   使用 `transform: scaleY()`

比如：

```
.collapsible {
    transition: transform 0.5s ease-out;
    transform-origin: top left;
}

.collapsed {
    transform: scaleY(0);
}
```

另外，在一些纯CSS写的手风琴的效果（Accordion）常使用 `max-height`替代`height`：

```
p {
    max-height: 800px;
    opacity: 1;
    transition: all 500ms ease;
}

input[type=checkbox]:checked ~ p {
    max-height: 0;
    opacity: 0;
}
```

See the Pen <a href="[https://codepen.io/Pavan\_Yuvan/pen/gPMdxR](https://codepen.io/Pavan_Yuvan/pen/gPMdxR)"> CSS only Accordion (No JavaScript)</a> by Pavan teja (<a href="[https://codepen.io/Pavan\_Yuvan](https://codepen.io/Pavan_Yuvan)">@Pavan\_Yuvan</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

有关于这方面更多的介绍，还可以阅读下面这些文章：

-   [Using CSS Transitions on Auto Dimensions](https://css-tricks.com/using-css-transitions-auto-dimensions/)
-   [How To Do CSS Transitions With Height: Auto](https://carlanderson.xyz/how-to-animate-on-height-auto/)
-   [Animating height: auto](https://nemzes.net/posts/animating-height-auto/)

如果希望想改变 `width` 时添加平滑的过渡动效，上面的方式也适用于 `width`。最简单地方式使用 `max-width` 替代 `width`。

### 与图片相关的防御式 CSS

图片已然成为 Web 中重要媒体，俗话说，一图胜过千言万言。[在 Web 中使用图片的方式很多种](https://www.w3cplus.com/css/how-to-use-web-image.html)，除了HTML的 `<img>` 可以将图片引入 Web 之外，HTML5 还新增了 `<picture>` 元素，让大家在 Web 中使用图片有更多的选择和方式。在 CSS 中为图片服务的属性也不少。比如说：

-   使用 `background-image` 和 `mask-image` 可以将图片引入 Web
-   使用 `background-size`、`mask-size`、`object-fit` 等要以控制图片的尺寸
-   使用 `background-position`、`mask-position`、`object-position` 等可以控制图片的位置
-   使用 `background-repeat` 、`mask-repeat` 等可以控制图片是排列方式
-   等等...

这些属性的使用可以帮助我们在处理 Web 图片时，具有一定的防御性。

### 防止图片拉伸或挤压

当我们无法控制Web上图片的宽高比时，最好能提前考虑，并在用户上传与宽高比不一致的图片时提供相应的解决方案。比如下面这个示例，在我们平时的业务开发中非常可见，一个带有产品图的卡片组件。

![](https://pic3.zhimg.com/v2-fb9ab86a7a8054c6fa9186fe266de23a_b.jpg)

当用户上图不同尺寸的图片时，图片将被拉伸（甚至会失真）。

![](https://pic4.zhimg.com/v2-98b4f05b4b719abfa545e0021f8eafc3_b.jpg)

针对这个现象，可以使用 `object-fit` 来解决：

```
.card__thumb {
    object-fit: cover;
}
```

![](https://pic1.zhimg.com/v2-8110a9ed694e02c29b5c3e41616e1080_b.jpg)

有一些[Reset CSS（重置CSS）中](https://www.w3cplus.com/css/new-reset-css.html)，喜欢将 `object-fit` 应用于所有 `img` 元素上，以避免 Web 上的图片被意外的抻伸或挤压：

```
img {
    object-fit: cover;
}
```

这是一个不错的选择，但并不是代表 `object-fit:cover` 适用于所有场景。有的时候，也需要根据场合做出正确（或者说合适）的选择。比如 [@Ahmad Shadeed](https://twitter.com/shadeed9) 的另一篇博文《[Aligning Logo Images in CSS](https://ishadeed.com/article/aligning-logos-css/)》。让产品Logo图片能在 Web 中有一个更好的呈现方式，如下图所示：

![](https://pic3.zhimg.com/v2-b3ebb1c0ce8b0609107b050df44acaca_b.jpg)

这个时候，运用在`img`上的 `object-fit`属性的`contain`要比`cover`更为合适：

```
.brands__item img {
    width: 130px;
    height: 75px;
    object-fit: contain;
}
```

在这样的场景中，`object-fit` 取值为 `contain` 的好处是，无论宽度或高度如何，Logo图片都包含在其中，不会被扭曲。

> 特别声明，在 `background-size` 和 `mask-size` 两个属性中，也可以取值为 `cover` 和 `contain`，使用方式和 `object-fit` 相似，不同之处是 `background-size` 用于背景图片，`mask-size` 用于蒙层图片。另外，`object-fit`除了可以取 `cover` 和 `contain`之外，还可以取`fill`、`scale-down`和`none`等值。  

当然，有些场景也不适合使用 `object-fit`、`background-size` 或 `mask-size` 的。比如说，如果元素或图片显式设置了一个固定高度的值。此时，使用 `background-size: cover` 或 `object-fit: cover` 就会出现图片过宽的情况，从而让图片失去重要的细节，可能会影响用户对图片的认知。

```
.card__thumb {
    height: 220px;
}
```

![](https://pic2.zhimg.com/v2-a3ee222fe8be28fef5bc6bdffb0b32c5_b.jpg)

如上图所示，因为图片设置了一个固定高度，这个时候`object-fit: cover` 把图片变得更宽，同时也导致卡片组件宽度也变宽。造成这种现象是因为没有显式指定一个宽高比。我们可以使用[CSS 的 aspect-ratio](https://www.w3cplus.com/css/css-aspect-ratio.html) 来避免这种现象：

```
.card__thumb img {
    aspect-ratio: 4 / 3;
}
```

> 注意，在CSS中实现宽高比除了使用 `aspect-ratio` 之外，还有一些其他 Hack 手段，如果你对这方面感兴趣的话，可以阅读《[CSS实现长宽比的几种方案](https://www.w3cplus.com/css/aspect-ratio.html)》一文。  

### 不要忘了 \*-repeat

> 这里的 `*-repeat` 指的是CSS中的 `background-repeat` 和 `mask-repeat`！  

通常，当使用尺寸比较大的图片作为背景图片时，不要忘记检查一下页面在大屏幕上的展示效果。图片作为背景，在默认情况下会被重复显示，这是因为 `background-repeat` 的默认值为 `repeat`。

由于笔记本电脑的屏幕相对较小，出现图片重复显示的概率相对较小。但在更大屏幕上，元素的尺寸也可能会随之变大，此时背景图片就有可能会被重复展示：

![](https://pic1.zhimg.com/v2-3e83aabe07c1fe57936c695ed1b752c8_b.jpg)

为了避免这种情况，我们需要显式设置 `background-repeat` 的值为 `no-repeat`:

```
.hero {
    background-image: url('..');
    background-repeat: no-repeat;
}
```

注意，如果你在开发过程中，使用 CSS 的 `mask` 属性，那么这样的现象也会出现在 `mask-repeat`上，需要将其设置为 `no-repeat`：

```
.hero {
    mask-image: url('..');
    mask-repeat: no-repeat;
}
```

如果你想更进一步的了解 `background-repeat` 和 `mask` 相关的知识，可以移步阅读：

-   [Clipping和Masking 何时使用](https://www.w3cplus.com/css/css-masking-and-clipping.html)
-   [探索CSS Masking模块：Masking](https://www.w3cplus.com/css/css-masking-and-clipping.html)
-   [单聊 background-repeat](https://www.w3cplus.com/css3/css3-background-repeat-space-round.html)

### img 底部的额外 4px

使用 `<img>` 将图片引入 Web 上时，在默认情况之下，图片浏览器中展示时，底部分有大约 `4px` 的空白间距。

![](https://pic2.zhimg.com/v2-b45fd2ab932ee2221b32d2ac3d6c96a5_b.jpg)

这是一个bug吗?当然不是，这是默认行为。

`<img>`元素默认情况之下是一个[可替换元素（Replaced Element）](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Replaced_element)。默认情况下，`<img>` 的底部与容器的基线（`baseline`）对齐。基线是像 `a`， `b`， `c`， `d` 这样的字母所在的位置，这意味着像 `g` ， `j`， `y` 这样的字母，它们的一部分位于基线以下(顺便说一下，这些部分被称为"下降")。这就是你在默认情况下看到的大约 `4px` 的间隙，因为图像是在基线上渲染的，为下降线留出空间。

这个问题是由于图片相对于同一行其他元素的`vertical-algin`造成的，我们可以很容易地通过以下方式进行纠正:

-   更改`vertical-align`属性，比如显式设置非`baseline`的值（[baseline是其默认值](https://www.w3.org/TR/css-inline-3/#transverse-alignment">)），如`top`、`bottom` 或 `middle`等，但该属性仅适用于内联元素
-   更改 `display` 属性值，使 `<img>` 成为一个块元素而不是内联元素
-   还有一些其他的技巧，包括设置父容器的`line-height`为`0`，设置父容器的`font-size`为`0`

就我个要而言，我更喜欢在重置样式表中，给`img` 添加一个全局的样式，避免Web上图片底部有这个`4px`额外空白间距出现：

> 注意，HTML 中的 `<iframe>` 和 `<video>` 元素和 `<img>` 同类型的标签元素，在这些元素中同样会存在这种现象，在使用类似 `<img>` 可替换元素时，都建议在重置CSS的时候，显式设置`display` 的值为`block`。  

### 图片上的文字

在 Web 中，很多场景中，文字会出现在图片之上：

![](https://pic1.zhimg.com/v2-65cbc9aa19eb49d4e84fad6e720bbd6c_b.jpg)

大多数的时候，开发者都会考虑在文本和图片之间增一个层，这个层可能是一个纯色层，也能是一渐变层，也可能是一个带有一定透明度的层，为增加文本的可读性：

![](https://pic1.zhimg.com/v2-bfad4da6374434827e3543cf0043433c_b.jpg)

正如《[处理图片上文字效果的几种姿势](https://www.w3cplus.com/css/handling-text-over-images-in-css.html)》一文所介绍的，有多种方式可以来处理，比如下面这个示例：

```
.card__content {
    background-image: linear-gradient(
        to top,
        hsla(0, 0%, 0%, 0.62) 0%,
        hsla(0, 0%, 0%, 0.614) 7.5%,
        hsla(0, 0%, 0%, 0.596) 13.5%,
        hsla(0, 0%, 0%, 0.569) 18.2%,
        hsla(0, 0%, 0%, 0.533) 22%,
        hsla(0, 0%, 0%, 0.49) 25.3%,
        hsla(0, 0%, 0%, 0.441) 28.3%,
        hsla(0, 0%, 0%, 0.388) 31.4%,
        hsla(0, 0%, 0%, 0.333) 35%,
        hsla(0, 0%, 0%, 0.277) 39.3%,
        hsla(0, 0%, 0%, 0.221) 44.7%,
        hsla(0, 0%, 0%, 0.167) 51.6%,
        hsla(0, 0%, 0%, 0.117) 60.2%,
        hsla(0, 0%, 0%, 0.071) 70.9%,
        hsla(0, 0%, 0%, 0.032) 84.1%,
        hsla(0, 0%, 0%, 0) 100%
    );
    color: #fff;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/MWvyGWp](https://codepen.io/airen/pen/MWvyGWp)"> Handling Text Over Images in CSS</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

但很少有同学会在编写 CSS 的时候，考虑`<img>` 加载失败时的图片展示。比如说下面这图，左侧是图片加载正常的情况下，右侧是图片加载失败的情况。

图片在加载的正常的情况下，文字具有可读性（效果看起来还不错），但当图片加载失败的时候，图片上文字效果会受到影响（如上图中右侧的示意图，白色的文字和背景几乎融为一体），用户很难看清楚文本内容。

![](https://pic3.zhimg.com/v2-1aee03ae7c8ba500b4cc6a9f9d504a3a_b.jpg)

注意，上图中是图片和文本之间没有添加任何样式。如果在文本和图片之间增加了额外层，即图片加载失败，文本的可读性不会像上图那么差，这根据你的中间层样式来决定：

![](https://pic4.zhimg.com/v2-2584b60f99079780cd937aabd27d277f_b.jpg)

其实，更具防御式的 CSS 应该是在 `<img>` 中设置一个与文本颜色具有一定对比度的颜色。比如一个`grey`颜色，这样一来，图片加载失败了，也不会影响图片上文本的可读性：

```
.card__thumb img {
    background-color: grey
}
```

![](https://pic4.zhimg.com/v2-7d15f07753122c11823d70eb774284bb_b.jpg)

这样做，即使你在图片和文本之间有一层，也不会受影响，他只会更好的增加对比度，提高可读性：

![](https://pic1.zhimg.com/v2-9037afc63518a6acc071bab0aa3783d0_b.jpg)

当然，你可以像 [@Ire Aderinokun](https://ireaderinokun.com/) 在 2016 年发表的博文《[Styling Broken Images](https://bitsofco.de/styling-broken-images/)》那样，[借助 CSS 伪元素::before 和 ::after](https://link.zhihu.com/?target=h%3Ccode%3Ettps%3A//w%3C/code%3Eww.%3Ccode%3Ew3cplus%3C/code%3E.com/css/fun-things-you-can-do-with-pseudo-elements.html) 为加载失败的图片定制一个更美观，更符合设计要求的样式：

```
img { 
    /* Same as first example */
    min-height: 50px;
}

img::before,
img::after {
    position: absolute;
    width: 100%;
    left: 0;

}

img:before { 
    content: " ";
    top: -10px;
    height: calc(100% + 10px);
    background-color: rgb(230, 230, 230);
    border: 2px dotted rgb(200, 200, 200);
    border-radius: 5px;
}

img:after { 
    content: "\f127" " Broken Image of " attr(alt);
    font-size: 16px;
    font-style: normal;
    font-family: FontAwesome;
    color: rgb(100, 100, 100);
    top: 5px;
    text-align: center;
}
```

效果如下：

See the Pen <a href="[https://codepen.io/airen/pen/OJxGNyR](https://codepen.io/airen/pen/OJxGNyR)"> Styling Broken Images with CSS</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

### 图片的最大宽度

一般来说，不要忘记为所有图片设置`max-width: 100%`。这可以添加到你使用的 CSS 重置样式中：

```
img {
    max-width: 100%;
    height: auto;
    object-fit: cover;
}
```

这样做是让图片具有一定的响应式能力。

### 暗黑模式下降低图片亮度

如果你的 [Web 应用要具备暗黑模式](https://www.w3cplus.com/blog/tags/700.html)，图片的处理也是一个不可忽略的细节。在一个小型的应用中，你可以[使用 HTML5 的 <picture> 元素](https://link.zhihu.com/?target=ht%3Ccode%3Etps%3A//www.w3cpl%3C/code%3Eus.com/html5/srcset-and-sizes-for-img-and-picture-element-part3.html)，为不同模式加载不同格式图片：

```
<picture>
    <source srcset="settings-dark.png" media="(prefers-color-scheme: dark)">
    <source srcset="settings-light.png" media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)">
    <img src="settings-light.png" id="screenshot" loading="lazy">
  </picture>
```

![](https://pic3.zhimg.com/v2-d7a5effd992944ea975958791e3bc18a_b.jpg)

但这种使用方式对于一中大型的Web应用来说，可能没有能力为 Web 应用提供两个版本的图片源。在这种情况之下，[可以使用 CSS 的滤镜 filter 特性来降低图片的亮度](https://link.zhihu.com/?target=http%3Ccode%3Es%3A//ww%3C/code%3Ew.w3cplus.com/css3/advanced-css-filters.html)，即 在 `dark` 模式下降低图片亮度：

```
@media (prefers-color-scheme: dark) {
    :root {
        --image-filter: grayscale(50%);
    }

    img:not([src*=".svg"]) {
        filter: var(--image-filter);
    }
}
```

使用 `filter` 降低图片的灰度（`grayscale(50%)`）虽然是`dark`模式下降底图片亮度的一个快速解决方案，但这不是最佳的方案。只有在不具备为暗黑模式提供专用图片的时候才推荐它。

### 图片上的内阴影

不知道是否曾在 `<img>` 元素上使用内阴影，像下面这样使用：

```
img { 
    box-shadow:inset 5px 5px 5px 5px #09fa00; 
}
```

如果你像上面这样给一个 `img` 设置一个内阴影，肯定有发现过，运用于图片上的内阴影丢失了：

![](https://pic1.zhimg.com/v2-dc67fd1d376e703d7fe40bea223c5984_b.jpg)

造成该现象的主要原因是 “**`img` 元素被认为是一个空元素，而不是一个容器元素**”。

> 注意，HTML中除了 `<img>` 元素是一个可替换元素（Replaced Element）之外，还有 `<iframe>`、`<video>`、`<embed>`等，除此之外，有些元素在特定情况下也会被视为可替换元素，比如 `<option>` 、`<audio>` 、`<canvas>`、`<object>` 和 `<applet>`等。另外，HTML规范也说了，`<input>`元素可替换，因为 `image` 类型的 `<input>` 元素就像 `<img>` 一样被替换。但是其他形式的控制元素，包括其他类型的 `<input>` 元素，被明确地列为非可替换元素（non-replaced elements）。  

虽然可替换元素有很多个，但 `box-shadow` 的内阴影（`inset`）用于这些可替换元素时会被视为空元素的只有 `<img>`、`<video>`、`<iframe>` 和 `<embed>`。比如，你在 `<video>` 上使用 `box-shadow` 内阴影时，它的表现和 `<img>` 一样。

See the Pen <a href="[https://codepen.io/airen/pen/PoJdyKv](https://codepen.io/airen/pen/PoJdyKv)"> box-shadow for Replaceable Element</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

要避开这个现象，我们要在 `<img>` 和 `<video>` 元素的外层再套一个容器元素，比如 `div`，并且将运用于`<img>`（或`<iframe>`）元素上的内阴影用到其容器元素上：

```
<!-- HTML -->
<div class="media--wrapper">
    <img src="" alt="" >
</div>

/* CSS */
.media--wrapper {
    box-shadow: inset 0 0 4vmin 3vmin rgb(0 0 0 / .5);
}

.media--wrapper img, 
.media--wrapper video {
    position: relative;
    z-index: -1;
}
```

你将看到的效果如下：

![](https://pic2.zhimg.com/v2-26eed7156da17fa12cc76b9b01bc54b1_b.jpg)

但这还不是最佳的解决方案，对于图片而言，把图片运用于 `background-image` 才是更好的方案，但对于 `<video>` ，上面的解决方案已是较佳的解决方案了。

> 如果你对 Web 中阴影的使用感兴趣，可以移步阅读《[图解CSS：CSS阴影](https://www.w3cplus.com/css/css-shadow.html)》一文。  

时至今日，图片已是Web重要媒体元素之一，大部分开发者都认为 Web 图片的展示非常的简单，方式也很多。我个人并不这么认为，特别是在 2021 年折腾渲染性能、响应式设计之类的，我发现要在 Web 上用好图片，难度还是较大的。如果你对这方面的话题感兴趣的话，可以阅读下面这些与图片相关的文章：

-   [探索Web上图片使用方式](https://www.w3cplus.com/css/how-to-use-web-image.html)
-   [聊聊 img 元素](https://www.w3cplus.com/html5/img-in-web.html)
-   响应式图片使用指南: [(Part1)](https://www.w3cplus.com/html5/srcset-and-sizes-for-img-and-picture-element-part1.html)、[Part2](https://www.w3cplus.com/html5/srcset-and-sizes-for-img-and-picture-element-part2.html)、[Part3](https://www.w3cplus.com/html5/srcset-and-sizes-for-img-and-picture-element-part3.html)和[Part4](https://www.w3cplus.com/html5/srcset-and-sizes-for-img-and-picture-element-part4.html)
-   [图片的优化](https://www.w3cplus.com/performance/web-performance-for-image.html)

### 与滚动体验相关的防御式 CSS

这部分是与滚动体验相关的 CSS 属性的设置，这些属性的运用大部分是用来改善滚动相关的体验。

### 锁定滚动链

> 滚动链指的是`z`轴的多个容器都出现了滚动。  

多个容器出现滚动条（`z`轴不同层的滚动容器）最常见的情景是你打开一个弹框（Modal）并向下滚动到底部（垂直方向）时，如果继续向下滚动则会引起弹框下方的内容（通常是 `body` 元素）会继续滚动。这也是滚动链默认的表现行为：

![](https://pic2.zhimg.com/v2-3bf674fb1427cd358a1e096c5a990315_b.jpg)

为了避免滚动扩散到其他滚动容器，我们可以在顶部的滚动容器中把 CSS 的 `overscroll-behavior`属性设置为 `contain`：

```
.modal__content {
    overscroll-behavior-y: contain;
    overflow-y: auto;
}
```

就我们这个示例而言，在弹框（Modal）中显式设置 `overscroll-behavior`之后，弹框中的滚动容器滚动底部之后不会影响底部（`body`）的滚动：

![](https://pic2.zhimg.com/v2-b02a1ccdf49c39cca6d9ea91f105b279_b.jpg)

> 注意，`overscroll-behavior` 属性只有在发生滚动的时候才会产生效果。有关于该属性更多的介绍，可以阅读《[CSS overscroll-behavior](https://www.w3cplus.com/css/overscroll-behavior.html)》一文。  

### 在必要时显示滚动条

在内容比较长的情况下，可以通过设置 `overflow` 控制滚动条是否展示。但是这里更推荐将`overflow`的值设置为 `auto`。如果你将 `overflow`显式设置为 `scroll`时，不管容器内容长短，滚动条都会像下图这样展示出来：

![](https://pic4.zhimg.com/v2-aca1232e2eea5126df51bf53abdc461f_b.jpg)

这种效果并不友好，在非必要的情况下，滚动条不应该向用户展示。只需要在滚动容器中显式设置`overflow`为`auto`即可改变这种现象：

```
.element {
    overflow-y: auto;
}
```

容器设置`overflow-y`为`auto`时，只有内容过长溢出滚动容器时滚动条才会向用户展示，内容不溢出容器则不会展示滚动条：

![](https://pic4.zhimg.com/v2-190d59d7ced3c7f72b84c3224f19feb3_b.jpg)

### 滚动条的占用空间

关于滚动条方面另外要注意的地方是 **滚动条占用元素的空间，导至渲染内容的区域变小**。比如在前面提到的例子中，当内容变长出现了滚动条的时候，会引起布局发生变化，因为滚动条要占用布局元素的空间。

![](https://pic4.zhimg.com/v2-363cf13552741a964259e8c46064d8d7_b.jpg)

仔细对比上图中前后的变化，不难发现滚动条导致白色的内容区变窄了。我们可以设置`scrollbar-gutter`属性来避免这个问题。

```
.element {
    scrollbar-gutter: stable;
}
```

![](https://pic4.zhimg.com/v2-dfb06efbf4f6605df354c4497ffcb8f7_b.jpg)

`scrollbar-gutter`是 **[CSS Overflow Module Level 4](https://www.w3.org/TR/css-overflow-4/%23scollbar-gutter-property)** 新增的一个特性。有了这个属性，开发者就可以更好的控制滚动条，或者解决因滚动条类型不同引起布局的差异变化。下图中展示了 `scrollbar-gutter`的取值不时的效果：

![](https://pic1.zhimg.com/v2-1254691630c730135f9b7276ef8fb784_b.jpg)

### 美化滚动条 UI

不过，你要美化滚动条UI的话，还是要使用 2021 年 12 月 09日，W3C 新发布了的 **[CSS Scrollbars Styling Module Level 1](https://www.w3.org/TR/css-scrollbars-1/)** 规范提供的 `scrollbar-color` 和 `scrollbar-width` 两个属性。以后，我们可以使用它们来轻易完成滚动条样式的定制：

```
.section {
    scrollbar-color: #6969dd #e0e0e0;
    scrollbar-width: thin;
}
```

![](https://pic2.zhimg.com/v2-ec76e3b43b8e4c7f9cbeb97a7a4a5015_b.jpg)

我想大家都知道，使用 CSS 来美化滚动条样式主要原因之一是因为滚动条在不同的系统平台上显示有差异，外观不统一。

### 让滚动效果更丝滑

在某些情况之下，你可能发现滚动会有一定的卡顿。我们可以滚动容器中设置`scroll-behavior`的值为`smooth`，让滚动更顺滑。很多时候为了让页面滚动更平滑，建议在 `html` 元素上设置该样式：

```
html {
    scroll-behavior: smooth;
}
```

![动图封面](https://pic2.zhimg.com/v2-5a7a792d5220635d1fa28616cd3344a5_b.jpg)

### 滚动捕捉

[CSS 滚动捕捉（CSS Scroll Snap）规范](https://www.w3.org/TR/css-scroll-snap-1) 提供了一些优化滚动体验的特性，**可以在用户滚动浏览文档时，将其滚动到特定的点（位置）**。这对于在移动设备上甚至在PC端上为某些类型的应用程序（比如滑块组件）创造一个更类似于应用程序（原生客户端）的体验是很有帮助的。

简而言之，CSS 滚动捕捉可以：

-   防止滚动时出现尴尬的滚动位置
-   创建更好的滚动体验

比如下面这个示例：

```
.container {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
}

img {
    scroll-snap-align: center;
    scroll-snap-stop: always;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/dyNJPoY](https://codepen.io/airen/pen/dyNJPoY)"> 水平全屏滚动</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

在上面的示例滑动图片的时候，滚动体验就像是在一个客户端应用中的滑动体验。你每次滚动的时候，只能滚动一张图片：

![](https://pic2.zhimg.com/v2-7dd2197f926f6b26f7e2046c5a6ebd41_b.jpg)

有关于滚动捕捉更详细的介绍，可以阅读下面这两篇文章：

-   [CSS滚动捕捉（Part1）](https://www.w3cplus.com/css/css-scroll-snap-part-1.html)
-   [CSS滚动捕捉（Part2）](https://www.w3cplus.com/css/css-scroll-snap-part-2.html)

上面提到这个有关于滚动相关的属性的使用，他更多是用来优化滚动体验的，似乎离防御式CSS有点距离，但还是列到这个系列中的主要原因是，使用这些CSS特性，并不是很复杂，很多的CSS代码，但给用户带来的体验是完全不一样的。为此，在开发过程中，应该尽可能在滚动容器上加上这些特性。

如果你对上面提到的这些属性感兴趣，想进一步了解的话，可以阅读下面这些文章：

-   [你所不知道的CSS Overflow Module](https://www.w3cplus.com/css/css-overflow-module.html)
-   [CSS overscroll-behavior](https://www.w3cplus.com/css/overscroll-behavior.html)
-   [改变用户体验的滚动新特性](https://www.w3cplus.com/css/new-scroll-features-that-change-the-user-experience.html)
-   CSS滚动捕捉：[Part1](https://www.w3cplus.com/css/css-scroll-snap-part-1.html)、[Part2](https://www.w3cplus.com/css/css-scroll-snap-part-2.html)

### 与圆角相关的防御式 CSS

自从[CSS](https://www.w3cplus.com/css/css-border-radius.html) 新增 border-radius 属性之后，在 Web 中构建圆角变得非常的简易，再也不需要依赖滑动门技术来实现圆角效果。但在使用 `border-radius` 给元素设置圆角时有几个地方需要注意。

### 嵌套圆角的计算

使用 `border-radius` 的时候，有的时候会产生圆角嵌套的视觉效果：

![](https://pic1.zhimg.com/v2-fb549b671bd7ea6aa5e31a3431e26dc4_b.jpg)

嵌套圆角的现象有可能发生在一个元素上，也有可能发生在内嵌元素之间，甚至都有可能同时发生在这两种现象中。一般情况之下，Web开发者在还原UI时，元素的`border-radius`的值是直接从视觉稿的图层属性中获取，很少在开发的过程中会注意圆角的嵌套现象。我们来看一个简单的示例：

```
<!-- HTML -->
<div class="card">
    <img src="" alt="" >
</div>

/* CSS */ 
:root {
    --border-radius: 10px;
    --border-width: 0px;
    --padding: 0px;
}

.card {
    border-width: var(--border-width);
    border-radius: var(--border-radius);
    padding: var(--padding);
}

.card img {
    --radius: calc(var(--border-radius) - var(--border-width) - var(--padding));
    border-radius: var(--radius);
}
```

See the Pen <a href="[https://codepen.io/airen/pen/BawEbLr](https://codepen.io/airen/pen/BawEbLr)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

调整示例中`border-radius`、`border-width` 和 `padding` 的值，你可看到容器`.card` 和内容 `img` 元素的 `border-radius` 的变化：

![](https://pic4.zhimg.com/v2-85f4f9ddeab67b8efce1a6e8e5d76797_b.jpg)

从上面的效果中不难发现，内容区域的圆角半径的值计算是按下面的公式来计算的：

其中：

-   `R` 是容器自身的 `border-radius` 的半径（外圆角半径）
-   `BW` 是容器自身的 `border-width` 的值（边框粗细）
-   `PW` 是容器自身的 `padding` 的值（内距）
-   `r` 内容区域的 `border-radius` 的半径（内圆角的半径）

如果是多个元素嵌套，且只在最外的容器显式设置 `border-radius`值，那么第一层嵌套的子元素的圆角半径将按上面的公式计算获得，且得出来的半径值将成为第二层的子元素的圆角半径（`R`）。依此类推，直到计算出来的 `border-radius` 的值为 `0`（小于`0`的值会被视为`0`）。

我想说的是，我们在还原 UI 的时候，需要考虑内外部元素之间的圆角半径之间的关系，这样在视觉的还原上会更协调。

### 半径重叠会发生什么

在Web中有一些UI的风格看上去就像“胶囊”的外形：

![](https://pic4.zhimg.com/v2-23cc959fc3fb9330e5927812b38694f3_b.jpg)

我们常把这种UI的风格称作“胶囊UI”，这种“胶囊UI”常用于一些`button`、`checkbox`和`radio`的元素上。

![](https://pic1.zhimg.com/v2-6f245805d0b1fe84f30bd2cb4340e450_b.jpg)

CSS实现这种胶囊UI的效果，为了能达到一劳永逸，时常给元素的`border-radius`值设置为一个较大的值，比如`999rem`、`999vmax`之类的。这样做不管元素高度是多少，都可以实现胶囊UI的效果：

```
.pill {
    border-radius: 999vmax;
}
```

这行代码的意思，我想大家都懂，`.pill`元素四个角的“圆角”半径都是`999vmax`。这种方式很方便，因为这意味着我们不需要知道元素（矩形框）的尺寸，它也能正常的工作。

![](https://pic1.zhimg.com/v2-ffd32ed987ee7e179633be12877c4b7c_b.jpg)

不过，在某些边缘情况上，会遇到一些奇怪的行为。比如在上面的示例基础上稍作调整，就是把`border-radius`的值设置为：

```
.pill {
    border-radius: 100px 999vmax 999vmax 100px;
}
```

你会发现元素 `.pill`左上角和左下角虽然设置了`border-radius`的半径值为`100px`，但并没有圆角效果：

![](https://pic3.zhimg.com/v2-276cffb216d7000fa53e9e2f10928086_b.jpg)

你可能会好奇，为什么左上角和左下角`100px`的`border-radius` 为什么没有生效？[其实W3C规范中已经给出了答案](https://www.w3.org/TR/css-backgrounds-3/%23corner-overlap)：

> **Let f = min(Li/Si), where i ∈ {top, right, bottom, left}, Si is the sum of the two corresponding radii of the corners on side i, and Ltop = Lbottom = the width of the box, and Lleft = Lright = the height of the box. If f < 1, then all corner radii are reduced by multiplying them by f**.  

具体的解释请看下图：

![](https://pic1.zhimg.com/v2-3562e4c9b48358271482a14bbe646080_b.jpg)

公式看上去令人感到困惑，甚至是令人头痛。但我们只需要记住一点：**这个公式的目的是防止`border-radius`（圆角半径）重叠**。简单地说：

> 客户端（浏览器）本质上是在想：“按比例缩小所有半径（`border-radius`），直到它们之间没有重叠”！  

我们来用简单的示例来阐述上述公式的一些基本原理，这样可以让大家更好的理解。

首先，它会计算矩形（元素）每条边的长度与与它接触的半径之和的比值：

```
元素每条边宽度 / (相邻圆角半径1 + 相邻圆角半径2)
```

比如元素`.pill`设置的样式：

```
.pill {
    width: 600px;
    height: 200px;
    border-radius: 400px;
}
```

就该示例而言，按照上面示提供的公式就可以“计算出`.pill`元素每条边的长度与与它接触的半径之和的比率”：

![](https://pic1.zhimg.com/v2-a51327ffca35e0a130a1ca640522edcc_b.jpg)

然后将所有圆角的半径去乘以这些比值（每条边计算出来的比率值）中的最小值。上例中计算出来的比率值只有`.75`和`.25`，取更小的值 `.25`，那么计算出来的圆角半径值则是：

我们元素`.pill`的`height`是`200px`（最短的边长），计算出来的`border-radius`刚好是`height`的一半，即 `100px`。这也让我们实现了一个“胶囊”UI效果。

为了能了解的更清楚一些，我们回到前面有问题的示例中，只不过我们用`400px`来替代`999vmax`，比如：

```
.pill {
    width: 600px;
    height: 200px;
    border-radius: 100px 400px 400px 100px;
}
```

同样根据上面的公式来计算出每边的比例：

```
Ratio » 元素每条边宽度 / (相邻圆角半径1 + 相邻圆角半径2)

Top    » 600px / (100px + 400px)  = 1.2
Right  » 200px / (400px + 400px)  = 0.25
Bottom » 600px / (400px + 100px)  = 1.2
Left   » 200px / (100px + 100px)  = 1
```

四个方向最小的比率是 `0.25`，那么所有指定圆角半径乘以这个比例：

```
Top-Left     » 100px x 0.25 = 25px
Top-Right    » 400px x 0.25 = 100px
Bottom-Right » 400px x 0.25 = 100px
Bottom-Left  » 100px x 0.25 = 25px
```

这样一来，运用于`.pill`元素的`border-radius`值为`25px 100px 100px 25px`：

![](https://pic3.zhimg.com/v2-5d662ac1b0cd2bb1b2e324cfa434ddbe_b.jpg)

是不是觉得非常的神奇。我想这部分内容能解答你平时碰到的一些怪异的现象，即 **使用`border-radius`怪异的现象**！

### 圆角碰到变换

前面提到过，在 CSS 中如果要给元素的 `width` 或 `height` 进行动画处理是需要采用别的技术方案的。比如说，使用 CSS 的 `transform`。但这也会有一个弊端。比如说，该元素设置了 `border-radius`。如下图所示，给一个设置了圆角（`border-radius`）的元素使用`transform` 来模拟宽度或高度变化的动效时，元素上的圆角并不会重新绘制，圆角只是被缩放了。

![](https://pic1.zhimg.com/v2-88848fe1fa6f1ea69f47012e2cdddcbc_b.jpg)

如果圆角要重新绘制就需要渲染引擎能重绘（Repaint），但GPU不会这样处理，它只处理像素，而不是元素的内容。因为 GPU 非常羞于处理像素（GPU只需要处理呈现该元素的像素），所以 `transform` 的操作的速度非常快。这也是使用`transform`来处理元素宽度或高度动效的主要原因之一。

如果要避免这种现象出现，就需要采用一些技术手段来规避。比如 [@Rik Schennink](https://twitter.com/rikschennink) 在他的文章《[Animating CSS Width and Height Without the Squish Effect](https://pqina.nl/blog/animating-width-and-height-without-the-squish-effect/)》中提到的[九宫法（9-slice scaling）](https://en.wikipedia.org/wiki/9-slice_scaling)。下面这个示例，我是在其文章中的示例做了稍微的调整：

```
<!-- HTML -->
<div class="radius">
    <div class="content"></div>
</div>

/* CSS */
.radius {
    height: 100px;
    display: flex;
    justify-content: flex-start;
}

.radius::before,
.radius::after {
content: "";
    width: 20px;
    background: #098fae;
}

.radius::before {
    border-radius: 20px 0 0 20px;
}

.content {
    background: #098fae;
    width: 1px;
    transform: scale3d(1, 1, 1);
    transform-origin: left;
}

.radius::after {
    border-radius: 0 20px 20px 0;
    transform: translate3d(0, 0, 0);
}

@keyframes right-animate {
    0% {
        transform: translate3d(0, 0, 0);
    }
    100% {
        transform: translate3d(80px, 0, 0);
    }
}

@keyframes center-animate {
    0% {
        transform: scale3d(1, 1, 1);
    }
    100% {
        transform: scale3d(81, 1, 1);
    }
}

.content {
    animation: center-animate 1s linear infinite alternate;
}

.radius::after {
    animation: right-animate 1s linear infinite alternate;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/xxXevpY](https://codepen.io/airen/pen/xxXevpY)"> Untitled</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

上面这个示例中：

-   使用 Flexbox 布局替代原示例的绝对定位
-   使用 3D Transform 替代原示例的 2D Transform
-   使用伪元素 `::before` 和 `::after` 替代了原来空标签元素 `.left` 和 `.right`

还有一种更好的方案，就是使用 [CSS Houdini 中的自定义属性 @property](https://www%3Ccode%3E.w3cplus.%3C/code%3Ecom/css/css-at-property.html) （也称 CSS Houdini 中的变量），[@property 可以进一步的扩展 CSS 的动效](https://www.w3cplus.com/css/exploring-property-and-its-animating-powers.html)。比如上面示例，采用 `@property` 可以像下面这样来实现：

```
@property --width {
    initial-value: 1px;
    inherits: false;
    syntax: "<length>";
}

@keyframes square {
    to {
        --width: 300px;
    }
}

.content {
    width: var(--width);
    animation: square 2s ease infinite alternate;
}
```

上面展示的只是示例用到的关键代码（`@property`和`@keyframes`部分），详细代码请查阅 Codepen上的示例：

See the Pen <a href="[https://codepen.io/airen/pen/gOGyyRy](https://codepen.io/airen/pen/gOGyyRy)"> Animating CSS width with @property</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

示例中左侧采用的是 Flexbox 布局，右侧采用的是 Grid布局。但动效采用的是相同的方案，效果几乎是一样的：

![](https://pic1.zhimg.com/v2-3d4493b0e007f35a7b9060c181b01180_b.jpg)

z-index 怎么失效了

如果你是一名前端面试官，在面试的时候提出，“有哪些方式可以触发`z-index`生效”？我想，大部分开发都会说：

> 当 `position` 属性的值为非 `static`，就会触发`z-index` 生效！  

这样的回答并没有问题，但不够全面。时至今日，在 CSS 中触发 `z-index` 生效，绝不仅 `position` 值是非 `static`，还有有很多种方式。[在 MDN 上有一个较为全面的清单](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)，描述了触发 `z-index` 生效方式：

-   文档根元素（`<html>`）
-   `position` 值为 `absolute` 或 `relative` 且 `z-index` 值不为 `auto` 的元素
-   `position` 值为 `fixed` 或 `sticky` 的元素
-   Flex项目，且 `z-index` 值不为 `auto`
-   Grid项目，且 `z-index` 值不为 `auto`
-   `opacity` 属性值小于 `1` 的元素
-   `mix-blend-mode` 属性值不为 `normal` 的元素
-   `transform`、`filter`、`perspective`、`clip-path`、`mask`、`mask-image`、`mask-border` 等属性值不为 `none` 的元素
-   `isolation` 属性值为 `isolate` 的元素
-   `-webkit-overflow-scrolling` 属性值为 `touch` 的元素
-   `will-change` 值设定了任一属性而该属性在 `non-initial` 值时会创建层叠上下文的元素
-   `contain` 属性值为 `layout`、`paint` 或包含它们其中之一的合成值（比如 `contain: strict、contain: content`）的元素

我们在元素上设置 `z-index` 的值主要是想用来控制元素在 `z` 轴上的顺序。它的值可以是 `auto`、`0`、正负整数值，其中 `auto` 是其默认值，但在表现上，`z-index` 取值 `auto` 和 `0` 是具有一定差异性的：

-   不设置 `z-index` 值时，默认是 `auto` 。默认层也就是 `0` 层
-   `z-index: 0` 与没有定义 `z-index` ，也就是`z-index: auto`在同一层级内没有高低之分，文档流中后出现的会覆盖先出现的
-   `z-index: 0` 会创建层叠上下文 `z-index: auto` 不会创建层叠上下文

一般使用 `z-index` 来决定层叠顺序时，会分下面两种情况来讨论：

-   如果层叠上下文元素不依赖`z-index`数值，则其层叠顺序是`z-index:auto`可看成`z-index:0`级别
-   如果层叠上下文元素依赖`z-index`数值，则其层叠顺序由`z-index`值决定，越大的值越在顶层

有关于这方面的讨论，可以详细阅读下面这些文章：

-   [What The Heck, z-index??](https://www.joshwcomeau.com/css/stacking-contexts/)
-   [Understanding Z-Index in CSS](https://ishadeed.com/article/understanding-z-index/)
-   [Z-index and stacking contexts](https://web.dev/learn/css/z-index/)
-   [深入理解CSS中的层叠上下文和层叠顺序](https://www.zhangxinxu.com/wordpress/2016/01/understand-css-stacking-context-order-z-index/)
-   [CSS定位和层叠控制](https://www.w3cplus.com/css/css-position-and-z-index.html)

但我们在实际开发过程中，时不时的会碰到 `z-index` 不生效，即使是在 `position` 值是非 `static` 的元素上。就在前不久，我们团队一位同学在开发一个页面时，在定位元素（一个固定定位）显式设置了 `z-index` 为 `9999`，但其父元素是一个滚动容器，为了让该滚动容器在 iOS 设备上滑动效果更佳，会使用 `-webkit-overflow-scrolling: touch;`。只不过，这个时候，他会让其子元素的 `position` 的非 `static` 的值都被忽略，渲染行为类似于 `static`，`z-index` 也就失效了。为了避免这个现象，我们可以通过 `transform: translateZ(0)` 的方式重新触发 `z-index` 生效。

另一个会让 `z-index` 失效的场景是在 `transform` 属性触发的 3D 场景。简单地说，`transform` 有的时候会让 `z-index` “临时失效”（事实并非 `z-index` 失效了），只是 `z-index` 被用在不同的层叠上下文（Stacking Context）上，而非默认的层叠上下文上同等地比较`z`轴的层级了。所在 DOM 在 `transform` 的工程中，DOM 处于一个新的层叠上下文中，`z-index`也是相对于这个层叠上下文，所以表现出来的实际是层叠上下文的层级，动画一结束，DOM 又回到默认的层叠上下文中，这时 `z-index` 才是在同一个上下文中比较。这种现象的解决方案大致会有两种：

-   方法1：父级，任意父级，非 `body` 级别，设置 `overflow:hidden` 可恢复和其他浏览器一样的渲染
-   方法2：以毒攻毒。也可以使用3D transform变换，比如 `translateZ(0)`

就我个人经验而言，往往碰到 `z-index` 不生效时，采用 `translateZ(0)` 准保OK!

### 避免 overflow: hidden 不生效

在 2019 年开发一个互动项目过程中，踩到了 `overflow:hidden` 不生效的案例。

```
.root {
    overflow-x: hidden;
    width: 100vw;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/zQMgqv](https://codepen.io/airen/pen/zQMgqv)"> How to fixed overflow-x not working on mobile</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

你会发现上面示例中的 `overflow-x:hidden` 未生效：

![](https://pic4.zhimg.com/v2-f0d3ce9f39429b571da8a2672471ad4f_b.jpg)

为什么会这样呢？简单地说，该示例触发了：

-   拥有`overflow:hidden`元素并不具有`position`取非`static`的值
-   内部元素通过`position:absolute`进行定位

一个绝对定位的后代块元素，部分位于容器之外。这样的元素是否剪裁并不总是取决于定义了`overflow`属性的祖先容器；尤其是不会被位于他们自身和他们的包含块之间的祖先容器的`overflow`属性剪裁。另外规范中也有说到：

> 当一个块元素容器的内容溢出元素的盒模型边界时是否对其进行剪裁。它影响被应用元素的所有内容的剪裁。但如果后代元素的包含块是整个视区（通常指浏览器内容可视区域，可以理解为`body`元素）或者是该容器（定义了`overflow`的元素）的父级元素时，则不受影响。  

通常一个元素的包含块由离它最近的块级祖先元素的内容边界决定。但当元素被设置成绝对定位时，包含块由最近的`position`不是`static`的祖先元素决定。这样一来，知道问题是什么原因造成的就好办了。只需要在设置有`overflow:hidden`的元素上添加`position`属性，具值是非`static`即可。

事实上这种情形并非一无事处，很多时候我们往往又需要让绝对定位的元素不会被设置了`overflow:hidden`的元素隐藏。比如Tooltips：

![](https://pic3.zhimg.com/v2-afa59952802e3353c4b26dd605f387ea_b.jpg)

对于上面这个示例的场景，我们需要一个这样的结构：

```
<div class="grand-parent">
    <div class="parent">
        <div class="child"></div>
    </div>
</div>
```

样式简单的如下：

```
.grand-parent {
    position:relative;
}

.parent {
    overflow:hidden;
}

.child {
    position:absolute; 
    top:-10px; 
    left:-5px;
}
```

See the Pen <a href="[https://codepen.io/airen/pen/RmELwY](https://codepen.io/airen/pen/RmELwY)"> Overflow and Position</a> by Airen (<a href="[https://codepen.io/airen](https://codepen.io/airen)">@airen</a>) on <a href="[https://codepen.io](https://codepen.io)">CodePen</a>.

另外`overflow`和`position:fixed`元素在一起使用的时候，`fixed`元素将会打破`overflow`容器的束缚。比如我们有这样的一个结构：

```
<!-- HTML -->
<div class="overflow">
    <img class="" src="" class="fixed" />
</div>

/* CSS */
.overflow {
    width: 50vw;
    height: 50vh;
    overflow: hidden;
}

.fixed {
    position: fixed;
    top: 2vw;
    left: 2vw;
}
```

众所周知，`position:fixed`在无特殊属性的限制的时候，其定位是相对于视窗边缘来定位的。即使他的父容器设置了`overflow:hidden`同样也会失效。比如上面这个示例，图片打破了设置`overflow:hidden`的容器`div`：

![](https://pic3.zhimg.com/v2-2f69b5d13a445c8a15b746bb70c2b046_b.jpg)

如果要破这样的局，让`fixed`的元素也会被剪切，我们可以借助`transform`来搞定，即`transform`除了`none`之外的任何值都会创建层叠上下文和包含块。那该元素就会是固定元素的包含块。

```
.overflow {
    overflow: hidden;
    transform: translateZ(0);
}
```

![](https://pic1.zhimg.com/v2-979d7b70f2e11f2fb66ec4a584522ba0_b.jpg)

在未来，可以使用CSS Containment达到等同的效果。使用`contain: paint`让 元素作为一个包含绝对定位和固定定位后代的块。

> 如果你想更深入了解 CSS 的 `overflow` 属性，还可以阅读《[你所不知道的CSS Overflow Module](https://www.w3cplus.com/css/css-overflow-module.html)》一文。  

### 避开 100vh 的坑

在《[2022 年的 CSS](https://www.w3cplus.com/css/what-is-new-css-in-2022.html)》一文中介绍新的视窗单位 `lvh`、`svh`时提到了 [iOS 上Safari使用 100vh 长期存在的Bug](https://link.zhihu.com/?target=https%3Ccode%3E%3A//ww%3C/code%3Ew.bram.us/2020/05/06/100vh-in-safari-on-ios/)。它不能与 `vh` 单位很好的配合。如果你将一个容器的高度设置为 `100vh` 时，会导致这个元素有点太高（会出现滚动条）。造成这种现象的主要原因是移动端上的 Safari 在计算 `100vh` 时忽略了它的部分用户界面。

![](https://pic3.zhimg.com/v2-7ae01029695b78f25c77f534d65dbc36_b.jpg)

如果你只是想快速解决这个问题，那可以将下面这段代码放到你的代码片段中：

```
body {
    height: 100vh;
}

@supports (-webkit-touch-callout: none) {
    body {
        height: -webkit-fill-available;
    }
}
```

### 并集选择器

对于同时作用到不同浏览器的样式，并不推荐使用并集选择器。比如，设置 `input` 中`placeholder` 的样式时，需要为每种浏览器使用对应的选择器。根据 w3c 的规定，我们如果在这种场景下使用了并集选择器，那么整个样式规则是不合法的。下面的代码是不推荐的。

```
/* 请不要像这样使用 */
input::-webkit-input-placeholder,
input:-moz-placeholder {
    color: #222;
}
```

下面的代码是推荐的。

```
input::-webkit-input-placeholder {
    color: #222;
}

input:-moz-placeholder {
    color: #222;
}
```

### 自定义属性备用值

[CSS 自定义属性 (变量) 被越来越多的用于Web开发中](https://www.w3cplus.com/css/css-custom-property.html)。为了避免破坏用户体验，我们需要做一些额外的处理，以防 CSS 自定义属性的值因某种原因为空。

特别是使用 JavaScript 设置 CSS 自定义属性的值时，要更加注意自定义属性的值无效的情况。比如下面的例子：

```
.message__bubble {
    max-width: calc(100% - var(--actions-width));
}
```

`calc()` 函数中使用了自定义属性 `--actions-width`，并且它的值由 JavaScript 代码提供。假如在某些情况下，Javascript 代码执行失败，那么 `max-width` 的值会被计算为 `none`。

为了避免发生这种问题，要用 `var()` 来设置一个备用值，当自定义属性的值无效时，这个备用值就会生效。

```
.message__bubble {
    max-width: calc(100% - var(--actions-width, 70px));
}
```

这样，如果自定义属性 `--actions-width` 未被定义，就会使用备用值 `70px`。这个方法用于自定义属性值可能会失败的场景，比如这个值来自于 JavaScript。在其它场景中，它并不是必须的。

待续...
-----

到目前为止，我能想到的都追加上来了，但我想肯定还有很多我没想到的。如果上面有什么是我遗漏的，欢迎分享。另外，在结束本文的时候，推荐下面几个站点，在这些站点上能获取一些新的 CSS 技术：

-   [CSS Protips](https://github.com/AllThingsSmitty/css-protips)
-   [SmolCSS](https://smolcss.dev/%23smol-document-styles)
-   [Modern CSS Solutions for Old CSS Problems](https://moderncss.dev/)
-   [CSS Hell: Collection of common CSS mistakes, and how to fix them](https://csshell.dev/)
-   [CSS Snippets](https://www.30secondsofcode.org/css/p/1)
-   [Style Stage: A modern CSS showcase styled by community contributions](https://stylestage.dev/)