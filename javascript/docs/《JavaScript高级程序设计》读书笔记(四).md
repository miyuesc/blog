# BOM & DOM

## 1. BOM

浏览器对象模型（BOM，Browser Object Model），是使用 JavaScript 开发 Web 应用程序的核心。

是实现 Web 开发与浏览器之间互相操作的基础。

BOM主要包含五个基础对象：

	1. window：表示浏览器实例
	2. location：加载文档的信息和常用导航功能实例
	3. navigator：客户端标识和信息的对象实例
	4. screen：客户端显示器信息
	5. history：当前窗口建立以来的导航历史记录

### 1.1 window 对象

BOM 的核心对象，有两个身份：ES中的全局作用域和浏览器窗口的JavaScript接口。

#### 1.1.1 global 全局作用域

所有使用 `var` 声明的变量和函数都会成为 `window` 对象的属性和方法。并且浏览器API 和 多数构造函数 都会以 `window` 对象的属性。

> 不同浏览器 `window` 对象的属性可能不同。

#### 1.1.2 窗口关系

`window` 对象的 `top` 属性始终指向最外层的窗口，及浏览器窗口本身。

`window` 对象的 `parent` 属性始终指向当前窗口的父窗口，如果当前窗口就是最外层窗口，则 `top` 等于 `parent`

`window` 对象的 `self` 属性始终指向自身。

#### 1.1.3 窗口属性

包含窗口位置、大小、像素比等。

```javascript
window.screenLeft // 窗口相对于屏幕左侧的距离, number (单位 px)
window.screenTop  // 窗口相对于屏幕顶部的距离, number (单位 px)

window.moveTo(x, y) // 移动到 (x, y) 坐标对应的新位置
window.moveBy(x, y) // 相对当前位置在两个方向上分别移动 x/y 个像素的距离
```

浏览器窗口大小不好确认，但是可以用 `document.documentElement.clientWidth` 和 `document.documentElement.clientHeight` 来确认可视窗口的大小。

> 移动浏览器中  `document.documentElement.clientWidth` 和 `document.documentElement.clientHeight` 返回的通常是实际渲染的页面的大小，而可视窗口可能只能显示一部分内容。

调整窗口大小可以使用 `resizeTo()` 和 `resizeBy()` 两个方法。

```javascript
// 缩放到 100×100
window.resizeTo(100, 100);
// 缩放到 200×150
window.resizeBy(100, 50);
// 缩放到 300×300
window.resizeTo(300, 300);
```

#### 1.1.4 视口位置

浏览器窗口尺寸通常无法满足完整显示整个页面，为此用户可以通过滚动在有限的视口中查看文档。

度量文档相对于视口滚动距离的属性有两对，返回相等的值：`window.pageXoffset/window.scrollX` 和 `window.pageYoffset/window.scrollY`。

可以使用 `scroll()` 、`scrollTo()` 和 `scrollBy()` 方法滚动页面。

```javascript
// 相对于当前视口向下滚动 100 像素
window.scrollBy(0, 100);
// 相对于当前视口向右滚动 40 像素
window.scrollBy(40, 0);
// 滚动到页面左上角
window.scrollTo(0, 0);
```

这几个方法也都接收一个 `ScrollToOptions` 字典，除了提供偏移值，还可以通过 `behavior` 属性告诉浏览器是否平滑滚动。

```javascript
// 正常滚动
window.scrollTo({
    left: 100,
    top: 100,
    behavior: 'auto'
});
// 平滑滚动
window.scrollTo({
    left: 100,
    top: 100,
    behavior: 'smooth'
});
```

#### 1.1.5 导航与跳转

`window.open()` 方法可以用于导航到指定 URL，也可以用于打开新浏览器窗口。这个方法接收 4个参数：要加载的 URL、目标窗口、特性字符串和表示新窗口在浏览器历史记录中是否替代当前加载页面的布尔值。

#### 1.1.6 定时器

`setTimeout()` 超时任务：等待一段时间之后再执行内部的代码，会返回一个超时ID

`setInterval()` 定时任务：每隔一段时间执行一次内部的代码，会返回一个定时ID

`clearTimeout()` 清除指定/所有超时任务。

`clearInterval()` 清除指定/所有定时任务。

`setTimeout()` 和 `setInterval()` 都接收两个参数：要执行的代码（函数）和等待 / 间隔时间（毫秒）。

> 所有超时任务都会在全局作用域中的一个匿名函数中执行，因此函数中所有的 this 指向都是 `window`(严格模式下是 `undefined`) 。如果定义 `setTimeout` 的时候传入的是一个**箭头函数**，则会保留原来的 this 指向。

`setTimeout` 可以不记录超时ID，因为它会在满足条件（执行定义时传入的函数时）自动停止，再次定义时会重新定义一个超时任务。

```javascript
let num = 0;
let max = 10;
let incrementNumber = function() {
    num++;
    // 如果还没有达到最大值，再设置一个超时任务
    if (num < max) {
    	setTimeout(incrementNumber, 500);
    } else {
    	alert("Done");
    }
}
setTimeout(incrementNumber, 500);
```

`setInterval()` 会在被销毁之前一直按照定义的间隔时间一直执行，而不会在意定义时传入的函数的执行状态。

> 如果 `setInterval()` 定义时传入的函数时一个异步请求 `Promise`，则异步请求后的回调函数执行顺序可能不会按照预想顺序执行。所以这种情况推荐使用超时任务 `setTimeout()` 而非 `setInterval()`。



### 1.2 location 对象

`location` 是最有用的 BOM 对象之一，提供了当前窗口中加载文档的信息，以及通常的导航功能。

>  它既是 `window` 的属性，也是 `document` 的属性。即 `window.location` 和 `document.location` 指向同一个对象。

解析 ：http://foouser:barpassword@www.wrox.com:80/WileyCDA/?q=javascript#contents

| 属性            | 值   | 说明 |
| --------------- | ---- | ---- |
| `location.hash` | "#contents" | URL 散列值（井号后跟零或多个字符）可为空 |
| `location.host` | "www.wrox.com:80" | 服务器名及端口号 |
| `location.hostname` | "www.wrox.com" | 服务器名 |
| `location.href` | "http://www.wrox.com:80/WileyCDA/?q=javascript#contents" | 完整 URL 字符串 |
| `location.pathname` | "/WileyCDA/" | URL 中的路径和（或）文件名 |
| `location.port` | "80" | 请求端口号 |
| `location.protocol` | "http:" | 页面使用的协议 |
| `location.search` | "?q=javascript" | 查询字符串，以问号开头 |
| `location.username` | "foouser" | 域名前指定的用户名 |
| `location.password` | "barpassword" | 域名前指定的密码 |
| `location.haoriginsh` | "http://www.wrox.com" | 源地址，只读 |

#### 地址操作

修改浏览器地址可以通过四种方式来修改：

1. `location.assign()`
2. `location.replace()`
3. `location.href = newLocation`
4. `window.location = newLocation`

其中 `location.href` 和 `window.location` 都会在内部显式调用 `location.assign()` 方法，并且向浏览器历史记录中增加一条记录。点击浏览器 "后退" 按钮可以回到上页。

而 `location.replace()` 可以直接修改地址重载页面，而不会向历史记录中插入数据，也无法返回上页。

另外 `location` 还提供了一个 `reload()` 方法，用来重载当前页面



### 1.3 navigator 对象

客服端标识浏览器的标准，主要用来记录和检测浏览器与设备的主要信息，也可以让脚本注册和查询自己的一些活动（插件）。



### 1.4 screen 对象

单纯的保存客服端能力的对象。包含以下属性：

| 属性          | 说明                                       |
| ------------- | ------------------------------------------ |
| `availHeight` | 屏幕像素高度减去系统组件高度，只读         |
| `availLeft`   | 没有被系统组件占用的屏幕的最左侧像素，只读 |
| availTop      | 没有被系统组件占用的屏幕的最顶端像素，只读 |
| availWidth    | 屏幕像素宽度减去系统组件宽度，只读         |
| colorDepth    | 表示屏幕颜色的位数，只读                   |
| height        | 屏幕像素高度                               |
| left          | 当前屏幕左边的像素距离                     |
| pixelDepth    | 屏幕的位深，只读                           |
| top           | 当前屏幕顶端的像素距离                     |
| width         | 屏幕像素宽度                               |
| orientation   | 返回 Screen Orientation API 中屏幕的朝向   |



### 1.5 history 对象

浏览器导航历史记录及相关操作的对象。

#### 1.5.1 导航

`history` 对象提供了三个方法和一个属性来查看和操作历史记录（当前窗口）。

```javascript
// 跳转到最近的 xxx 页面
history.go("xxx");
ry.back();

// 前进一页
history.forward()
```

`go()` 方法会接收一个**字符串**或者**整数**参数，传入整数时，正整数表示前进多少页，负整数表示后退多少页；传入字符串时，会匹配含有该字符串的最近的一条历史记录对应的网址，如果没有找到则不会发生变化。

`history` 提供一个 `length` 属性，可以用来查看当前窗口的历史记录数量。

#### 1.5.2 历史状态管理

1. `hashchange` 事件：页面 URL 的散列变化时被触发
2. `history.pushState()` 方法：接收 3 个参数：一个 state 对象、一个新状态的标题和一个（可选的）相对 URL
3. `popstate` 事件（在 `window` 对象上）：后退时触发
4. `history.state` 属性：当前的历史记录状态
5. `history.replaceState()` 方法：接收与 `pushState()` 一样的前两个参数来更新状态




## 2. DOM

文档对象模型（DOM，Document Object Model），是 HTML 和 XML 文档的编程接口。

DOM 现在是真正跨平台、语言无关的表示和操作网页的方式。

> IE8 及更低版本的 IE 浏览器，是通过 COM 对象实现的，所以这些版本中的 DOM 对象会具有不同的行为和功能。
>
> 不过在21世纪，个人也建议抛弃对 IE 的适配，毕竟连微软都用上了新的 Edge 浏览器。

### 1. 节点层级

**任何 HTML 或 XML 文档都可以用 DOM 表示为一个由节点构成的层级结构。**

example：

```html
<html>
    <head>
    	<title>Sample Page</title>
    </head>
    <body>
    	<p>Hello World!</p>
    </body>
</html>
```

转换为层级结构如下图：

![image-20210201145230332](screenshot/image-20210201145230332.png)





























