# 用HTMX重新思考前端开发

> 原文：[《Rethinking the frontend with HTMX》](https://medium.com/@marcnealer/rethinking-the-frontend-with-htmx-780045980352)
>
> 作者：[Marc Nealer](https://medium.com/@marcnealer)

我在FastAPI方面做了很多工作，这让我接触到了FastHTML。虽然这个库还远未准备好投入实际使用，但它的一个组件是HTMX，所以我分支出来看了看。我发现的东西让我感到惊讶，并让我对前端开发方式进行了一些严肃的重新思考。

## 什么是HTMX？

HTMX是一个微小的JavaScript库，它基本上允许你使用HTML标签中设置的属性来触发Ajax调用并处理响应。重要的是，它期望响应是HTML片段，然后可以将其放置在当前页面中。

所以一个简单的用例是触发一个ajax调用，响应是用于替换触发调用的元素的HTML。我看了看这个并试了试。我的第一个想法是为什么！！第二次看，然后第三次，我开始明白为什么HTMX可能会以巨大的方式改变前端，特别是如果你使用一个具有强大模板引擎的好后端。

## HTMX的原因

HTMX要求你重新思考如何进行前端编码。长期以来，我们一直基于这样的想法工作：前端进行Ajax调用返回json，然后我们将其渲染到模板中，或者对dom中的元素进行更改。HTMX基本上说所有渲染都由后端完成。不再发送JSON，也不再用JavaScript改变元素，相反，我们得到HTML并只是替换/添加到前端的元素。我们基本上从前端的JavaScript做大部分工作转向使用后端和后端的模板引擎来提供即用的HTML片段。

所以HTMX需要做的就是基于正确的事件发送Ajax调用，然后决定当HTML返回时会发生什么。

## HTMX的简单性

为了保持简单，我将把HTMX分解为三个部分。

1. 将成为触发器的事件的详细信息
2. 调用的详细信息以及应该发送什么
3. 对调用返回的HTML做什么的详细信息

文档可能有点令人困惑，所以我将采用与他们不同的方法，依次处理每个部分。

### 1. 触发

首先让我们看一个非常简单的例子：

```html
<!DOCTYPE html>
<html>
<head>
  <title>Simple HTMX Example</title>
  <script src="https://unpkg.com/htmx.org@1.9.5"></script>
</head>
<body>
  <button hx-get="/data" hx-trigger="click" hx-swap="outerHTML">
    Click Me
  </button>
</body>
</html>
```

我在这里只谈论hx-trigger属性。如你所见，它设置为在按钮元素的点击时触发。也就是说，该属性不需要声明。默认事件是"click"，除了输入元素设置为"change"和表单设置为"submit"。

对于其他属性，hx-get表示对URL进行get请求，hx-swap="outerHTML"表示用返回的HTML片段替换整个按钮。稍后会详细介绍，让我们谈论触发器。

触发事件可以是标准WebAPI支持的任何事件，包括键盘和鼠标事件。因此，你可以在鼠标指针离开元素时触发，或者在向输入元素添加内容时按下键时触发。

但是，我们可以使用一系列修饰符来改变触发器发生的时间。

```html
<!DOCTYPE html>
<html>
<head>
  <title>Simple HTMX Example</title>
  <script src="https://unpkg.com/htmx.org@1.9.5"></script>
</head>
<body>
  <div hx-get="/data" hx-trigger="every 1s" hx-swap="outerHTML">
    updated even 1 second
  </div>
</body>
</html>
```

上面的项目将每1秒触发一次，因此允许轮询后端。

下一个例子是hx-trigger指向不同元素的地方。在这种情况下，当按钮被点击时进行Ajax调用。

```html
<!DOCTYPE html>
<html>
<head>
  <title>HTMX Example with Div Trigger</title>
  <script src="https://unpkg.com/htmx.org@1.9.5"></script>
</head>
<body>
  <div id="my-div" hx-get="/data" hx-trigger="click from:#button1" hx-swap="outerHTML">
    Initial content of the div.
  </div>
  <button id="button1">Click me to update div</button>
</body>
</html>
```

还有其他触发器的"修饰符"。

- **changed** :> 仅在元素的值已更改时触发
- **delay:<time>** :> 将操作延迟设定的时间量（1s，2s等）
- **throttle:<time>** :> 将延迟请求的发送，但也会取消在设定时间段内导致触发的任何进一步事件。适合阻止用户过多点击按钮。

#### 1.1 触发器：竞争条件

所以想象一下我们有一个表单，在表单内部，我们有一个输入元素，它使用htmx来验证用户的输入。我们如何阻止用户在验证发生时提交表单。

```html
<form hx-post="/store">
    <input id="title" name="title" type="text"
        hx-post="/validate"
        hx-trigger="change"
        hx-sync="closest form:drop">
    <button type="submit">Submit</button>
</form>
```

这里的hx-sync说如果在最近的表单上触发事件，那么新事件应该被丢弃或不运行。因此，输入元素的验证具有优先级，提交请求被拒绝。

我们当然可以反过来做。

```html
<form hx-post="/store">
    <input id="title" name="title" type="text"
        hx-post="/validate"
        hx-trigger="change"
        hx-sync="closest form:abort">
    <button type="submit">Submit</button>
</form>
```

在这种情况下，如果用户在验证进行时提交表单，验证将被中止，表单提交将继续。

还有其他同步选项：
- **drop** - 丢弃新请求
- **abort** - 中止当前请求
- **replace** - 用新请求替换当前请求

### 2. 请求

现在让我们看看实际的HTTP请求部分。HTMX支持所有标准的HTTP动词：

- `hx-get` - 发送GET请求
- `hx-post` - 发送POST请求
- `hx-put` - 发送PUT请求
- `hx-patch` - 发送PATCH请求
- `hx-delete` - 发送DELETE请求

#### 2.1 发送数据

对于表单，HTMX会自动序列化表单数据并发送。对于其他元素，你可以使用`hx-vals`属性来发送额外的数据：

```html
<button hx-post="/clicked" hx-vals='{"clicked": true}'>
    Click Me!
</button>
```

你也可以使用`hx-include`来包含其他元素的值：

```html
<div>
    <input id="email" name="email" type="email">
    <button hx-post="/register" hx-include="#email">
        Register
    </button>
</div>
```

#### 2.2 请求头

HTMX会自动添加一些有用的请求头：
- `HX-Request: true` - 表示这是一个HTMX请求
- `HX-Trigger` - 触发请求的元素的ID
- `HX-Target` - 目标元素的ID
- `HX-Current-URL` - 当前页面的URL

你也可以使用`hx-headers`添加自定义头：

```html
<button hx-post="/clicked" hx-headers='{"X-Custom-Header": "value"}'>
    Click Me!
</button>
```

### 3. 响应处理

这是HTMX真正发光的地方。当服务器返回HTML时，HTMX需要知道如何处理它。这就是`hx-swap`属性的作用。

#### 3.1 交换策略

`hx-swap`属性定义了如何将返回的HTML插入到页面中：

- `innerHTML` - 替换目标元素的内部HTML（默认）
- `outerHTML` - 替换整个目标元素
- `beforebegin` - 在目标元素之前插入
- `afterbegin` - 在目标元素内部的开始处插入
- `beforeend` - 在目标元素内部的结束处插入
- `afterend` - 在目标元素之后插入
- `delete` - 删除目标元素
- `none` - 不交换任何内容

```html
<div id="results">
    <button hx-get="/more" hx-target="#results" hx-swap="beforeend">
        Load More
    </button>
</div>
```

#### 3.2 目标选择

默认情况下，HTMX会将响应交换到触发请求的元素中。但你可以使用`hx-target`指定不同的目标：

```html
<button hx-get="/info" hx-target="#info-panel">
    Get Info
</button>
<div id="info-panel"></div>
```

你可以使用CSS选择器来指定目标：
- `#my-id` - 按ID选择
- `.my-class` - 按类选择
- `closest .container` - 最近的祖先
- `find .child` - 查找后代
- `next .sibling` - 下一个兄弟元素
- `previous .sibling` - 上一个兄弟元素

#### 3.3 动画和过渡

你可以使用`hx-swap`的修饰符来添加动画：

```html
<button hx-get="/content" hx-swap="innerHTML swap:1s">
    Smooth Update
</button>
```

这将在1秒内平滑地交换内容。

## HTMX的优势

### 1. 简单性
HTMX让你可以用HTML属性创建动态Web应用程序，而不需要编写复杂的JavaScript。

### 2. 渐进增强
HTMX遵循渐进增强的原则。如果JavaScript被禁用，你的应用程序仍然可以工作（尽管功能有限）。

### 3. 服务器端渲染
所有的HTML都在服务器上生成，这意味着更好的SEO、更快的初始页面加载和更简单的状态管理。

### 4. 减少复杂性
不需要复杂的前端框架、构建工具或状态管理库。

### 5. 更好的缓存
HTML响应可以被浏览器缓存，提高性能。

## HTMX的挑战

### 1. 学习曲线
虽然HTMX本身很简单，但它需要你重新思考Web开发的方式。

### 2. 服务器负载
所有的渲染都在服务器上进行，这可能会增加服务器负载。

### 3. 复杂的UI
对于非常复杂的用户界面，传统的JavaScript框架可能仍然更合适。

### 4. 生态系统
HTMX的生态系统比React或Vue等成熟框架要小。

## 何时使用HTMX

HTMX特别适合：

1. **内容驱动的应用程序** - 博客、新闻网站、文档站点
2. **表单密集的应用程序** - 管理面板、数据输入系统
3. **原型开发** - 快速构建和测试想法
4. **现有应用程序的增强** - 为传统Web应用程序添加交互性
5. **小团队项目** - 当你想要减少技术栈复杂性时

## 结论

HTMX代表了Web开发的一种回归基础的方法。它提醒我们，并不是每个应用程序都需要复杂的JavaScript框架。通过将渲染责任转移回服务器，HTMX提供了一种构建动态Web应用程序的简单而强大的方式。

虽然它可能不适合每个项目，但HTMX绝对值得考虑，特别是如果你正在寻找一种更简单的方式来为你的Web应用程序添加交互性。它可能会改变你对前端开发的思考方式，就像它改变了我的一样。

在一个JavaScript疲劳真实存在的世界里，HTMX提供了一股清新的空气。它证明了有时候，最好的解决方案是最简单的。