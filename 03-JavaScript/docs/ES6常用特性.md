# ES6 常用特性梳理

ECMAScript 2015 （即 ES 6），在原 ES 的基础上增加了跟多新特性，并且这些特性极大简化了当前 JavaScript 编程中的代码量与可读性。

## 1. ES6（ECMAScript2015）

### 1.1 let / const

ES6 支持使用 `let` 和 `const` 来声明变量，且支持大括号的块级作用域、不可被提升。

并且同一作用域下不允许被重复声明。

> 可以用来解决类似循环体类闭包产生的问题。

### 1.2 导入与导出

ES6 引入的模块化概念的具体实现。

#### 导出

允许在一个模块中使用`export`来导出多个变量或函数。

```javascript
export var name = 'Rainbow'; // 导出变量
export const sqrt = Math.sqrt; //导出常量

let name = 'Rainbow';
let age = '24';
export { name, age }; // 导出多个变量

// 导出函数
export function myModule(someArg) {
	return someArg;
}
```

#### 导入

定义好模块的输出以后就可以在另外一个模块通过import引用。

```javascript
import { myModule } from 'myModule'; // main.js
import { name, age } from 'test'; // test.js
```

### 1.3 箭头函数

箭头函数与包围它的代码共享同一个`this`, 能帮你很好的解决`this`的指向问题。

> 不论是箭头函数还是bind，每次被执行都返回的是一个新的函数引用，因此如果你还需要函数的引用去做一些别的事情（譬如卸载监听器），那么你必须自己保存这个引用。

```javascript
const func = (a, b) => {
    return a + b;
}
```

### 1.4 函数定义默认值

ES6支持在定义函数的时候直接为参数设置默认值。

```javascript
function sum(a, b = 5) {
    return a + b;
}

sum(5); // 10
```

### 1.5 模板字符串

可以直接在字符串中以 `${}` 的形式插入变量。

```javascript
let a = "stra";
let b = `stra,${a}`;
```

### 1.6 扩展运算符 `...`

扩展运算符可以将一个数组或者对象的 **第一层** 展开成一个一个的元素，也可以用于拆解字符串。

```javascript
let a = [1, 2, 3, , 10]; // [1, 2, 3, undefined, 10]
a.length = 6; // [1, 2, 3, undefined, 10, undefined]
console.log(...a); // 1 2 3 undefined 10 undefined

let b = [1, [2, 3], [4, [5, 6]]];
console.log(...b); // a [2, 3] [4, [5, 6]]

let c = {
    c1: "c1",
    c2: "c2",
    c3: { d1: "d1", d2: "d2" }
};
console.log({...c});
// log
{
    c1: "c1",
    c2: "c2",
    c3: { d1: "d1", d2: "d2" }
}
```

> 使用扩展运算符可以实现一般对象的浅拷贝。

### 1.7 聚合参数

聚合参数可以在函数定义时，将多余参数合并到一个数组变量中保存。

```javascript
function f (x, y, ...a) {
    return (x + y) * a.length
}
f(1, 2, "hello", true, 7) === 9
```

### 1.8 类 `Class`

使 `JavaScript` 的面向对象编程变得更加简单、易于理解。

```javascript
class Animal {
    // 构造函数，实例化的时候将会被调用，如果不指定，那么会有一个不带参数的默认构造函数.
    constructor(name,color) {
        this.name = name;
        this.color = color;
    }
    // toString 是原型对象上的属性
    toString() {
        console.log('name:' + this.name + ',color:' + this.color);
    }
}

let animal = new Animal('dog','white');//实例化Animal
animal.toString(); // name:dog,color:white

console.log(animal.hasOwnProperty('name')); //true
console.log(animal.hasOwnProperty('toString')); // false
console.log(animal.__proto__.hasOwnProperty('toString')); // true

class Cat extends Animal {
    constructor(action) {
        // 子类必须要在constructor中指定super 函数，否则在新建实例的时候会报错.
        // 如果没有置顶consructor,默认带super函数的constructor将会被添加
        super('cat','white');
        this.action = action;
    }
    toString() {
        console.log(super.toString());
    }
}

let cat = new Cat('catch')
cat.toString(); // name:cat,color:white

// 实例cat 是 Cat 和 Animal 的实例，和Es5完全一致。
console.log(cat instanceof Cat); // true
console.log(cat instanceof Animal); // true
```

### 1.9 增强对象属性

在定义对象时支持属性、方法的简写，支持计算属性名，支持生成器形式属性。

```javascript
// 属性简写
let x = 0, y = 0;
let obj = { x, y }; // obj: {x: 0, y: 0}
// 方法简写
let obj = {
    foo (a, b) {
        //…
    },
    bar (x, y) {
        //…
    }，
    *quux (x, y) {
        …
    }
}
// 计算属性名
let obj = {
    foo: "bar",
    ['foo' + f()]: "func"
}
```

### 1.10 解构赋值

可以将属性/值从对象/数组中取出赋，值给其他变量。对找不到的元素或者属性，会对声明的变量赋值 `undefined`。

> 结构赋值可以在声明变量的时候重新定义变量名。

```javascript
// 数组解构，与位置严格相关。
let [a, , b] = [1, 2, 3]

console.log(a, b) // 1 3

// 对象解构，与位置无关，可以在声明时重新定义新变量（新的变量名）
let { name, age: newAge } = { age: 26, name: "miyue" }

console.log(name, newAge) // "miyue"  26

// 可以定义缺省时（即解构获取值时获取不到）可以设置默认值
let [a = 1] = []

console.log(a) // 1

// 可以配合 async/await 对请求结果进行解构赋值，简化代码
async request() {
    // 最好加上try/catch 捕获请求异常
    let {
        data: { data, status, message }
    } = await Axios.get("xxx");
}
```

结构赋值也可以嵌套使用，但是注意结构赋值对等号左侧的大括号 `{}` 有**特殊解析**：

```javascript
let { a, b: { c: {} } } = {a: 12, b: { c: { d: 123, e: 1233 }, f: 123 }, g: 234 };
// 这里只会定义一个变量 a， a = 12;

let { a, b: { c } } = {a: 12, b: { c: { d: 123, e: 1233 }, f: 123 }, g: 234 };
// 这样才会定义两个变量 a, c
// a = 12
// c = { d: 123, e: 1233 }
```

嵌套结构会结构到最里面一层，并且只会声明没有使用 `: {}` 这种形式的变量，如果遇到 `{}`，则会尝试继续向内部结构。

### 1.11 Map & Set

#### 1.11.1 `Map`

与对象类似的 `键/值`存储方式，某些地方可以比对象更高效的来完成。

对象 `Object` 是能以数值、字符串或者符号作为键，`Map` 则可以使用任意数据类型作为键。

`Map` 的初始化需要传入 `[key, value]` 形式的元素组成的二维数组，初始化之后可使用 `set(key, value)` 增加新的键值对。可以使用 get()和 has()进行查询，还可以使用 delete()和 clear()删除值

```javascript
const m1 = new Map([
    ["key1", "val1"],
    ["key2", "val2"],
    ["key3", "val3"]
]);
m1.set("key4", "value4")
```

#### 1.11.2 `Set`

一种新的集合类型，像“加强的”`Map` 类型。

但是 `Map` 是以键值对的形式保存的，而 `Set` 更像是只有值的数组。

`Set` 内部可以使用任何类型作为值，并且使用严格相等的标准来检查，**同一 `Set` 实例中有且只能有一个独立的值，如果添加了相同的值，则会覆盖之前的值**。

初始化完成之后，可以使用 add()增加值，使用 has()查询，通过 size 取得元素数量，以及使用 delete()和 clear()删除元素。

```javascript
const s = new Set()
alert(s.has("Matt")) // false
alert(s.size) // 0

s.add("Matt").add("Frisbie")
alert(s.has("Matt")) // true
alert(s.size);
```

> 另外 ES6 还新增了 `WeakMap` 与 `WeakSet` ，因为用的较少，这里暂时不做解释。

### 1.12 `Proxy`

ES6新增的特性，对目标对象的创建一个代理对象，可以记录对目标对象的所有操作行为，我们可以通过代理实现监听、拦截、记录等功能。`Vue 3.0` 就是使用 `Proxy` 来重构了响应式部分。

`Proxy` 一起的还有一个"捕获器"的概念，即定义对象对应的基本操作的拦截器。

语法： `const p = new Proxy(target, handler)`

`handler`：包含捕获器（拦截器）的占位对象，`target`：被代理的原对象。

```javascript
const target = {
    foo: 'bar'
}
const handler = {
	// 捕获器在处理程序对象中以方法名为键
    get() {
    	return 'handler override'
    }
}
const proxy = new Proxy(target, handler)
console.log(target.foo) // bar
console.log(proxy.foo) // handler override
```

> 注：如果直接调用原对象的属性或者方法，则会绕过代理和代理定义的拦截器。

```javascript
// handler 可用捕获器
const handler = {
    get() {},
    set() {},
    has() {},
    deleteProperty() {},
    apply() {},
    construct() {},
    getOwnPropertyDescriptor() {},
    defineProperty() {},
    getPrototypeOf() {},
    setPrototypeOf() {},
    enumerate() {},
    ownKeys() {},
    preventExtensions() {},
    isExtensible() {}
}
```

### 1.13 `Promise`

ES6 提供的用来处理JavaScript异步编程的一个对象，在一个 `Promise` 对象被创建出来的时候不一定就是已经知道的值。它可以将异步操作的最终结果（成功的结果或者失败的原因）与对应的处理程序关联起来，使异步方法可以想同步方法一样返回值。

> 异步方法 （`Promise`中定义的方法）并不会立即返回最终的值，而是返回一个 `promise` 对象。

`Promise` 有三个状态：

1. 运行中（等待中）：`pending`，初始状态，表示还没成功，也没有失败，还在运行中
2. 成功：`fulfilled`，操作成功（也叫 `resolved`）
3. 失败：`rejected`，操作失败

一个 `Promise` 对象提供三个方法：`promise.then()`, `promise.catch()` 和 `promise.finally()` 。

这三个方法返回的都是一个新的 `Promise` 对象实例，这表示他们可以用来做链式调用

```javascript
const promiseFunc = (new Promise())
	.then(handleResolvedA)
	.then(handleResolvedB)
	.then(handleResolvedC)
	.catch(handleRejectA)
```

### 1.14 其他

ES6还新增像 "迭代器"，"生成器"等新特性，增加了内置对象的方法，扩展了 `Unicode` 字符集等。

```javascript
Number.EPSILON
Number.isInteger(Infinity) // false
Number.isNaN("NaN") // false

Math.acosh(3) // 1.762747174039086
Math.hypot(3, 4) // 5
Math.imul(Math.pow(2, 32) - 1, Math.pow(2, 32) - 2) // 2

"abcde".includes("cd") // true
"abc".repeat(3) // "abcabcabc"

Array.from(document.querySelectorAll('*')) // Returns a real Array
Array.of(1, 2, 3) // Similar to new Array(...), but without special one-arg behavior
[0, 0, 0].fill(7, 1) // [0,7,7]
[1, 2, 3].find(x => x == 3) // 3
[1, 2, 3].findIndex(x => x == 2) // 1
[1, 2, 3, 4, 5].copyWithin(3, 0) // [1, 2, 3, 1, 2]
["a", "b", "c"].entries() // iterator [0, "a"], [1,"b"], [2,"c"]
["a", "b", "c"].keys() // iterator 0, 1, 2
["a", "b", "c"].values() // iterator "a", "b", "c"

Object.assign(Point, { origin: new Point(0,0) })
```

-- These codes come from [lukehoban - es6features](https://github.com/lukehoban/es6features#math--number--string--array--object-apis)