# 新的CSS if()函数将永远改变你的样式编写方式

> 原文： [《How the New CSS if() Function Is Going to Change Your Way of Styling Forever》](https://medium.com/@arnoldgunter/the-new-css-if-function-will-change-your-way-of-styling-forever-a90e251ad3a1)
>
> 作者：[Arnold Gunter](https://medium.com/@arnoldgunter)

我们再次见证了CSS开发团队的新奇迹。

新的CSS `if()` 函数已经在Chrome 137中登陆。

想想看：每次更新都让CSS感觉更加强大，模糊了CSS和编程之间的界限——让JavaScript在某些任务上变得不那么必需。

因为以前，我们必须用JavaScript根据某些条件（如元素的颜色或类）来确定样式，然后根据值执行进一步的操作。

对于那些现在会说"CSS不是编程语言"的反对者——我说只要看看这个疯狂的新功能能做什么，是时候重新思考这个说法了。

话不多说，让我们开始吧！

👉 想要免费的CSS选择器备忘单？
订阅我的免费每周网页开发通讯，立即获得PDF——超级简单，超级有用。

## if()函数带来了什么

首先：这是一个原生CSS函数，不需要任何额外的JavaScript。

正如名称所示，你可以使用它根据条件为元素应用某些样式，就像在编程语言中一样。

### 语法

```css
div {
    color: if(
        style(<某些条件>): <某些值>;
        style(<其他条件>): <其他值>;
        else: <默认值>;
    );
}
```

如你所见，在`if()`函数中，你可以指定多个条件及其对应的样式。如果没有条件匹配，则应用`else`值。

`style()`函数定义条件，如果条件为真，则应用相应的值。

### 基本示例

这里有一个如何在CSS中使用`if()`函数的简单示例：

```html
<div class="dark">dark</div>
<div class="light">light</div>
```

我们可以使用`if()`函数根据元素的类有条件地应用背景颜色：

```css
div {
  color: var(--color);
  background-color: if(
      style(--color: white): black;
      else: pink
  );
}

.dark {
  --color: black;
}

.light {
  --color: white;
}
```

这里，`if()`函数检查`--color`变量是否设置为白色。如果是，背景颜色设置为黑色，否则默认为粉色。

### 更高级的示例

`if()`函数在需要根据HTML属性应用不同样式的场景中真正发光。

例如，我们可以利用`data-status`属性动态改变元素的`border-color`、`background-color`，甚至`grid-column`：

```html
<div class="container">
  <div class="card" data-status="pending"></div>
  <div class="card" data-status="complete"></div>
  <div class="card" data-status="pending"></div>
  <div class="card" data-status="inactive"></div>
</div>
```

以下是如何应用动态样式：

```css
.card {
  --status: attr(data-status type(<custom-ident>));
  border: 1px solid;
  border-color: if(
      style(--status: pending): royalblue;
      style(--status: complete): seagreen;
      else: gray
  );

  background-color: if(
      style(--status: pending): #eff7fa;
      style(--status: complete): #f6fff6;
      else: #f7f7f7
  );

  grid-column: if(
      style(--status: pending): 1;
      style(--status: complete): 2;
      else: 3
  );
}
```

### 主题切换示例

这个示例演示了如何使用`if()`函数基于自定义属性创建主题切换：

```css
.theme-demo {
  --theme: light;
  background-color: if(style(--theme: dark): #2d3748; else: #ffffff);
  color: if(style(--theme: dark): #ffffff; else: #2d3748);
  border: 2px solid if(style(--theme: dark): #4a5568; else: #e2e8f0);
}
```

### 按钮变体

创建具有条件样式的灵活按钮组件，用于变体和大小：

```css
.custom-button {
  --variant: primary;
  --size: medium;
  background-color: if(
      style(--variant: success): #48bb78;
      style(--variant: danger): #f56565;
      style(--variant: warning): #ed8936;
      else: #4299e1
  );
  padding: if(
      style(--size: small): 0.5rem 1rem;
      style(--size: large): 1rem 2rem;
      else: 0.75rem 1.5rem
  );
}
```

## 工作原理

CSS `if()`函数提供了一种简洁的方式来表达条件值。它接受一系列以分号分隔的条件-值对。该函数会依序评估每个条件，并返回与第一个为真的条件关联的值。如果所有条件的计算结果均为假，则该函数会返回一个空令牌流。

最常见的使用`if()`的方式是与样式查询一起使用——检查CSS自定义属性（变量）的值来确定应用哪些样式。

## 浏览器支持

`if()`函数目前仅在Chrome的最新版本（137及以上版本）中受支持。但似乎更多浏览器正在考虑在未来添加对它的支持。所以，请谨慎使用！

要测试浏览器支持，你可以使用以下CSS：

```css
@supports (background: if(style(--test: 1): red; else: blue)) {
  .supported {
    background: green;
    color: white;
  }
}

@supports not (background: if(style(--test: 1): red; else: blue)) {
  .not-supported {
    background: red;
    color: white;
  }
}
```

## 革命性影响

CSS正在逐渐成为一种真正的"编程语言"。随着CSS变量、`calc()`函数、`:has()`和`:is()`等伪类以及万能的`@media`查询等新功能的引入，CSS正在让编写复杂样式和布局变得更加容易。

`if()`函数代表了我们处理条件样式方法的范式转变。虽然浏览器支持目前仅限于Chrome 137+，但这个功能可能会在各浏览器中快速扩展。

如果你编写任何被他人使用和/或样式化的组件，你就知道这有多重要！这个功能承诺让我们的样式表更易维护，我们的设计系统更灵活，我们的组件更智能。

## 总结

新的CSS `if()`函数是一个游戏规则改变者，它将条件逻辑直接带入CSS，消除了许多场景中对复杂变通方法和JavaScript干预的需求。虽然目前仅在Chrome 137+中可用，但这标志着CSS向更强大、更具表现力的样式语言发展的重要一步。

准备尝试了吗？下载测试文件并开始探索条件CSS的可能性吧！