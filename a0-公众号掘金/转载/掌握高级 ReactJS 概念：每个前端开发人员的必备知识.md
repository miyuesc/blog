> 原文：[《Mastering Advanced ReactJS Concepts: Essential Knowledge for Every Frontend Developer》](https://medium.com/@shivambhadani_/mastering-advanced-reactjs-concepts-essential-knowledge-for-every-frontend-developer-8123cf0b13ab)
>
> 作者：[Shivam Bhadani](https://medium.com/@shivambhadani_)



在这篇博客里，我们要一口气搞定所有 ReactJS 的高级概念！看完这篇，前端面试你就能横着走，甚至还能自己造个 ReactJS 一样的库，想想都刺激！

# 本文目录

1.  什么是渲染？它是怎么发生的？
2.  什么是重新渲染？组件什么时候会重新渲染？
3.  认识虚拟 DOM
4.  什么是协调算法？
5.  ReactJS 的性能优化

# 什么是渲染？它是怎么发生的？

如果你用过 ReactJS，肯定没少听"渲染"这个词。今天我们就来深挖一下它。

在 ReactJS 里，我们写的是 JSX。JSX 就是 JavaScript XML，是 ReactJS 发明的一种语法，看起来像 HTML。可浏览器只认 JavaScript，不认 JSX！所以，JSX 得先变成 JavaScript，这活儿就交给了 ReactJS 的编译器——**Babel**。

## Babel 是怎么把 JSX 变成 JavaScript 的？

Babel 会把 JSX 变成 `React.createElement()` 的调用，这个函数会返回一个 JavaScript 对象，叫做 **React 元素（React Element）**。

记住下面这句话，刻进 DNA 里：我们的终极目标就是从 JSX 得到 React Element。你可以手写 `React.createElement()`，也可以写 JSX 让 babel 自动帮你转。

## React.createElement() 是啥？

`React.createElement()` 是 React 里最底层的造元素（节点）函数。JSX 其实就是 `React.createElement()` 的**语法糖**。

我们先学怎么把 JSX 翻译成 `React.createElement()`，再看看这个函数到底返回了啥。

比如你写了这么个 JSX：

```jsx
const jsx = <h1>Hello, React!</h1>;
```

它会被转成：

```js
const element = React.createElement("h1", null, "Hello, React!");
```

## `React.createElement()` 的语法

```js
React.createElement(type, props, ...children)
```

参数说明：

`type` **（字符串或组件）**：

- 如果是**字符串**，就代表普通 HTML 标签（比如 "h1"、"div"）。
- 如果是**函数或类**，就代表 React 组件。

`props` **（对象）**：

- 标签上的属性，比如 `className`、`id`、`onClick` 等。
- 没有属性就写 null。

`...children` **（可选）**：

- 元素里的内容（文本、其他元素或组件）。

![img](https://miro.medium.com/v2/resize:fit:875/1*-hk6NCvN_fLL7J1_pcLk7w.png)

**例子1**：

JSX：

```jsx
const Jsx = <h1>Hello, React!</h1>;
```

转成 React.createElement 调用：

```js
const element = React.createElement("h1", null, "Hello, React!");
```

**例子2**：

JSX：

```jsx
const Jsx = <h1 className="title">Hello, React!</h1>;
```

转成 React.createElement 调用：

```js
const element = React.createElement("h1", { className: "title" }, "Hello, React!");
```

例子3：

JSX：

```jsx
<div>
  <h1>Hello</h1>
  <p>Welcome to React</p>
</div>
```

转成 React.createElement 调用：

```js
const element = React.createElement(
  "div",
  null,
  React.createElement("h1", null, "Hello"),
  React.createElement("p", null, "Welcome to React")
);
```

例子4：

JSX：

```jsx
const Jsx = <Card data = {cardData} />
```

转成 React.createElement 调用：

```js
const element = React.createElement(Card, { data: cardData })
```

我说过，children 是可选的，没有就省略。

**复杂点的例子**：

简单的例子都懂了吧？来个复杂点的，彻底搞明白：

JSX：

```jsx
function App() {
  return (
    <div className="container">
      <h1>Welcome to React</h1>
      <UserCard name="Shivam" age={22} />
      <button onClick={() => alert("Button Clicked!")}>Click Me</button>
    </div>
  );
}

function UserCard({ name, age }) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}
```

我们一步步来：

第一步：转 `UserCard` 组件

```js
function UserCard(props) {
  return React.createElement(
    "div",
    { className: "user-card" },
    React.createElement("h2", null, props.name),
    React.createElement("p", null, `Age: ${props.age}`)
  );
}
```

第二步：转 `App` 组件

```js
function App() {
  return React.createElement(
    "div",
    { className: "container" },
    React.createElement("h1", null, "Welcome to React"),
    React.createElement(UserCard, { name: "Shivam", age: 22 }),
    React.createElement(
      "button",
      { onClick: () => alert("Button Clicked!") },
      "Click Me"
    )
  );
}
```

现在你应该明白了，JSX 怎么变成 `React.createElement()` 的。你可以直接写 HTML 风格的 JSX，也可以手写 `createElement()`，反正最后 babel 都会帮你转成后者。

## React.createElement() 的输出长啥样？

这个函数会返回一个朴实无华的 JavaScript 对象，这个对象就叫 **React 元素（React Element）**。

```js
React.createElement(type, props, ...children)
```

它返回的对象大概长这样：

```json
{
  type: "",
  props: {
    
  },
  key: "",
  ref: ""
}
```

注意：props 里不仅有标签属性，还有 children。

`<div>hello</div>` 和 `<div chilren="hello" />` 是一回事。所以 props 里会有 children。

例子：

```js
const element = React.createElement("h1", { className: "title" }, "Hello, React!");
console.log(element);
```

输出：

```json
{
  type: "h1",
  props: {
    className: "title",
    children: "Hello, React!"
  },
  key: null,
  ref: null,
  _owner: null,
  _store: {}
}
```

## 拆解一下输出

- `type: "h1"` → 告诉 React 这是个 `<h1>` 标签。
- `props` → 这里面有属性（比如 `className`）和子元素。
  `className: "title"` → 这是传给 `<h1>` 的 className。
  `children: "Hello, React!"` → `<h1>` 里的内容。
- `key` → 如果你用 map 渲染列表，肯定传过 key，这就是那个 key。后面会讲 key 的真正用法。
- `ref` → 用来直接操作 DOM。如果你用过 useRef()，就懂。
- `_owner` 和 `_store` → React 内部用的，初学者可以无视。

**例子**：

JSX：

```jsx
<div id="container">
  <h1>Hello</h1>
  <p>Welcome to React</p>
</div>
```

React.createElement 调用：

```js
const element = React.createElement(
  "div",
  { id: "container" },
  React.createElement("h1", null, "Hello"),
  React.createElement("p", null, "Welcome to React")
);
console.log(element);
```

**输出**：

```json
{
  type: "div",
  props: {
    id: "container",
    children: [
      {
        type: "h1",
        props: { children: "Hello" },
        key: null,
        ref: null
      },
      {
        type: "p",
        props: { children: "Welcome to React" },
        key: null,
        ref: null
      }
    ]
  },
  key: null,
  ref: null
}
```

我觉得例子已经够多了，这下你肯定明白了吧？还有疑问欢迎评论区提问！

## 渲染到底是啥？

在 React 里，渲染就是把 React 元素（JSX 或 `React.createElement()` 得到的对象）变成真正的 **DOM 元素**，让它们出现在屏幕上。

渲染分两种：

1. 初次渲染
2. 重新渲染

## 初次渲染是怎么发生的？

下面这段代码就是关键：

```jsx
function App() {
  return <h1>Hello, React!</h1>;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```

如果你建过 ReactJS 项目，去 `index.jsx` 里就能看到。

步骤如下：

- `App()` 返回 `<h1>Hello, React!</h1>`。
- React 把它变成 React 元素对象。

```json
{
  type: "h1",
  props: { children: "Hello, React!" },
}
```

- React 创建一个**虚拟 DOM**。
- React 更新**真实 DOM**（`<h1>` 被插进了 `#root`）。

大项目里，组件成千上万，嵌套一大堆，最后会生成一个巨大的 JS 对象树。用这个对象树造 DOM，第一次会很慢。但 React 只会在第一次全量造 DOM。

你肯定发现，第一次启动 React 项目很慢，后面再渲染就飞快。这就是"虚拟 DOM"和"协调算法"带来的优化。

虚拟 DOM 后面会详细讲！

# 什么是重新渲染？组件啥时候会重新渲染？

重新渲染，就是组件更新、重新执行，让 UI 跟着变化。但不是啥都触发重新渲染，React 很聪明，只有必要时才会重新渲染。

组件会在以下情况**重新渲染**：

1. 自己的 State 变了（`useState` 或 `this.setState` 被更新）
2. Props 变了（父组件传了新 props）
3. 父组件重新渲染了（哪怕 props 没变）

## 因为 State 变了而重新渲染

组件的 **state** 用 `useState` 更新时会重新渲染。

```jsx
import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  console.log("Counter Re-Rendered!");

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default Counter;
```

每次点按钮，count 变了，组件就会重新渲染，UI 立马跟上。

## 因为 Props 变了而重新渲染

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Child count={count} />
      <button onClick={() => setCount(count + 1)}>Update Count</button>
    </div>
  );
}


function Child({ count }) {
  console.log("Child Re-Rendered!");

  return <h1>Count: {count}</h1>;
}

export default Parent;
```

点按钮，`count` 变了，Parent 重新渲染（第一条规则），Child 也会重新渲染，因为 Child 拿了 count 作为 props。props 变了，组件就得重新渲染。

## 因为父组件重新渲染导致的子组件重新渲染

哪怕子组件的 props 没变，只要父组件重新渲染，子组件也会跟着重新渲染。

![img](https://miro.medium.com/v2/resize:fit:875/1*EJwopRpAQFzIGiCX4Hc2Kg.png)

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  console.log("Parent Re-Rendered!");

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Re-Render Parent</button>
      <Child />
    </div>
  );
}


function Child() {
  console.log("Child Re-Rendered!");
  return <h1>Hello</h1>;
}

export default Parent;
```

- Parent 组件重新渲染（state 变了）。
- `Child` 组件也会重新渲染，哪怕它没接 props。

如果你不想让 Child 这种情况下也跟着重渲染，可以用 React.memo() 包一下 Child。这样只有前两种情况才会重渲染。

你可能会问，如果不用 React memo()，每次组件重渲染整个子树都跟着重渲染，岂不是卡成 PPT？
答：ReactJS 可聪明了！它有虚拟 DOM 和协调算法，后面会讲！

## React 18+ Strict Mode 下的双重渲染

React 18+ 里，开发模式下 `<React.StrictMode>` 里的组件会渲染两次，用来检测副作用。

```jsx
import React from "react";
import ReactDOM from "react-dom";

function App() {
  console.log("Component Rendered!");
  return <h1>Hello</h1>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

开发模式下，你会看到控制台打印两次"Component Rendered!"。
生产环境不会这样，别慌！

# 认识虚拟 DOM

虚拟 DOM（V-DOM）就是 React 在内存里维护的一个轻量级的 DOM 副本。它让 React 能高效地更新 UI，而不用每次都直接怼真实 DOM。

**为啥 React 要用虚拟 DOM？**

- 真实 DOM 很慢 → 直接操作性能堪忧。
- 更新真实 DOM 很贵 → React 尽量减少没必要的改动。
- React 会批量处理更新 → 只改该改的。

## 虚拟 DOM 怎么工作的？

**第一步**：渲染阶段（创建 V-DOM）：

```jsx
function App() {
  return <h1>Hello, World!</h1>;
}
```

React 调用 `App()`，生成虚拟 DOM：

```json
{
  "type": "h1",
  "props": { "children": "Hello, World!" }
}
```

这个 V-DOM 不是啥真东西，就是个 JS 对象树。

**第二步**：Diff 阶段（新旧虚拟 DOM 对比）：
state/props 变了，React 会生成新的虚拟 DOM，然后和上一个虚拟 DOM 比一比。

```jsx
function Counter() {
  const [count, setCount] = React.useState(0);

  return <h1>Count: {count}</h1>;
}
```

点按钮，count 变了，React 生成新的虚拟 DOM：

```json
{
  "type": "h1",
  "props": { "children": "Count: 1" }
}
```

React 用协调算法（Reconciliation Algorithm）把新旧 V-DOM 对比一遍。

第三步：打补丁（高效更新真实 DOM）

- React 找出**不同点（diff 阶段）**。
- React **只更新变了的部分**，不动没变的。

**举个栗子**：

- 如果 `<h1>` 里只是文本从 "Count: 0" 变成 "Count: 1"，
  React 只会改文本，不会整个 `<h1>` 都重造。

那它到底怎么改的？
答：学过 JS 操作 DOM 的都懂，`document.getElementByID().innerHTML = "Count: 1"`，其实就是普通 JS。React 只不过用 diff 算法帮你挑出最该动的地方，最大限度减少 DOM 操作。

# 什么是协调（Reconciliation）？

协调就是 React 的一套算法，帮你高效地更新真实 DOM，尽量少动。

## 协调的步骤：

1. state/props 变了，生成新的虚拟 DOM。
2. 新旧 V-DOM 对比（diff）。
3. 找出变了啥（React 的 Diff 算法）。
4. 只更新变的部分。

## React 的 Diff 算法（高效检测变化的秘诀）

1. **规则1**：元素类型变了，整个重造！
   元素类型要是变了，React 直接干掉旧的，造个新的。忘了啥是 type？上面 `React.createElement()` 的第一个参数！

```jsx
function App({ showText }) {
  return showText ? <h1>Hello</h1> : <p>Hello</p>;
}
```

- `<h1>` 变成 `<p>`，React 直接删 `<h1>`，新造 `<p>`！
- 这样很慢，因为 React 不是改，是全删全造。
- **规则2**：类型一样，只改属性，飞快！

如果类型一样，React 只会改变的属性。

```jsx
function App({ text }) {
  return <h1 className="title">{text}</h1>;
}
```

- `text` 从 "Hello" 变成 "World"，React 只改文本。
- `<h1>` 不会重造，更新速度嗖嗖的。
- **规则3**：列表用 key，Diff 才高效！

渲染列表时，React 用 key 跟踪变化。

写得不好的（没 key）→ Diff 很低效

```jsx
function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
}
```

- 新加一个 item，React 会把所有 `<li>` 都重渲染。
- 因为没 key，React 分不清谁是谁。

写得好的（有 key）→ Diff 超高效

```jsx
function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

- 有了 key，React 能精准跟踪每个 `<li>`。
- 新加 item，只更新必要的元素。

key 一定要唯一，列表渲染才快！现在你明白为啥控制台老提醒你加 key 了吧？

# ReactJS 的性能优化

## 用 `React.memo()` 记忆组件

认真看了重渲染那一节你就知道，第三种情况（子组件没接 props）其实没必要跟着重渲染。
要避免这种无用功，就用 React.memo 包一下子组件，导出时这样写：

```js
export default React.memo(MyComponent)
```

这样第三种情况就不会重渲染了。前两种还是会，因为 UI 必须跟着变。

例子：

```jsx
import React, { useState, memo } from "react";

const ChildComponent = memo(({ count }) => {
  console.log("Child Rendered");
  return <h2>Count: {count}</h2>;
});

function App() {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState("");

  return (
    <div>
      <ChildComponent count={count} />
      <button onClick={() => setCount(count + 1)}>Increment Count</button>
      <input onChange={(e) => setValue(e.target.value)} placeholder="Type here" />
    </div>
  );
}
```

- 不用 `React.memo()`，`ChildComponent` 每次 App 渲染都跟着重渲染，哪怕只是 value 变了。
- 用了 `React.memo()`，只有 `count` 变了才会重渲染。

## `useMemo()` —— 记忆计算结果

假如你有个函数，参数一来就要算半天。如果不用 useMemo()，每次调用都得重新算一遍。
比如函数接 (a, b)，你传 (2, 3) 算一遍，再传 (2, 3) 还得再算。
用 useMemo()，同样参数只算一次，下次直接用缓存值。学过 DSA 的同学，这不就是 DP 吗！

例子：

```jsx
import React, { useState, useMemo } from "react";

function expensiveComputation(num) {
  console.log("Computing...");
  return num * 2;
}

function App() {
  const [count, setCount] = useState(0);
  const [number, setNumber] = useState(5);

  const computedValue = useMemo(() => expensiveComputation(number), [number]);

  return (
    <div>
      <h2>Computed Value: {computedValue}</h2>
      <button onClick={() => setCount(count + 1)}>Increment Count</button>
    </div>
  );
}
```

- 不用 `useMemo()`，`expensiveComputation` 每次渲染都要算。
- 用了 `useMemo()`，只有 number 变了才会重新算。

用 useMemo()，专治那些不需要频繁重算的昂贵计算。

## `useCallback()` —— 记忆函数

组件重渲染时，里面的函数都会重新创建，引用也变了。
但用 useCallback() 包一下，每次渲染都用同一个函数引用，不会新建。

有两大好处：

1. 每次重渲染不用新建函数，省时间。
2. 如果这个函数要传给子组件，不用 useCallback()，哪怕你用 React.memo 包了子组件，子组件还是会重渲染（第二条规则，回去复习下）。
   因为 props 里的函数引用变了，React 以为 props 变了。用 useCallback()，每次都是同一个引用，子组件不会白白重渲染。

例子：

```
import React, { useState, useCallback } from "react";
import ChildComponent from "./ChildComponent";

function App() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log("Button clicked");
  }, []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment Count</button>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}
```

- 不用 `useCallback()`，`handleClick` 每次渲染都新建，子组件白白重渲染。
- 用了 `useCallback()`，只有依赖变了才会新建。

传函数给子组件，记得用 useCallback()！