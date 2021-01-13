# 记录JavaScript高频面试题与基础问题

## 1. 数据类型和语言基础

### 1.1 基础数据类型

6种简单类型（也称为原始类型）：`Undefined`、`Null`、`Boolean`、`Number`、`String`、`Symbol`，其中 `Symbol` (符号类)是`ES6`新增的

1种复杂类型（也称为引用类型）：`Object`

一般情况下，简单类型以**栈**保存，复杂类型以**堆**保存，在栈中保存引用地址

### 1.2 变量声明

有三个关键字可以声明变量：`var`、`let`、`const`

1. `var`：声明在函数作用域，存在变量提升
2. `let`：与 `var` 类似但有以下注意事项：
   - 只限于块作用域，并且不会被提升
   - 不能重复声明
   - 在全局作用域用 `let` 声明的变量不会挂载到 `window` 下
3. `const`： 行为模式与 `let` 基本相同，但声明时必须初始化变量，且不能被修改

> 提升：将变量声明提升到所属作用域的最顶部，并赋值为 `undefined`

### 1.3 特殊类型与特殊值

1. `NaN`：`Number`类型，意思是“不是数值”

   - 任何涉及 `NaN` 的操作都返回 `NaN`

   - `NaN` 不等于任何值，包括 `NaN`

   - 在 `JavaScript` 中提供了 `isNaN()` 的方法来判断是否是 `NaN`

2. `Symbol`：符号类

   - 声明的符号是唯一的、不可变的
   - `Symbol()` 不能使用 `new` 关键字一起作为构造函数使用

3. `Object`：引用类型，对象其实就是一组数据和功能的集合  

   - 每个 Object 实例都有如下属性和方法。
     1. `constructor`：用于创建当前对象的函数。
     2. `hasOwnProperty(propertyName)`：用于判断当前对象实例（不是原型）上是否存在给定的属
        性。要检查的属性名必须是字符串（如 `o.hasOwnProperty("name")`）或符号。
     3. `isPrototypeOf(object)`：用于判断当前对象是否为另一个对象的原型。（第 8 章将详细介绍
        原型。）
     4. `propertyIsEnumerable(propertyName)`：用于判断给定的属性是否可以使用（本章稍后讨
        论的） for-in 语句枚举。与 `hasOwnProperty()`一样，属性名必须是字符串。
     5. `toLocaleString()`：返回对象的字符串表示，该字符串反映对象所在的本地化执行环境。
     6. `toString()`：返回对象的字符串表示。
     7. `valueOf()`：返回对象对应的字符串、数值或布尔值表示。通常与 `toString()`的返回值相同。  

### 1.4 原始值与引用值

> ECMAScript 变量可以包含两种不同类型的数据：原始值和引用值。 原始值（primitive value）就是
> 最简单的数据， 引用值（reference value）则是由多个值构成的对象。  

**保存原始值的变量是按值访问的 ，保存引用值的变量是按引用。**

#### 1.4.1 动态属性

原始值和引用值的定义方式很类似，都是创建一个变量，然后给它赋一个值。  

但是，引用值可以随时随意添加、修改、删除其属性和方法，原始值不能有属性和方法。

```javascript
let person = new Object();
person.name = "Nicholas";
console.log(person.name); // "Nicholas"

let name = "Nicholas";
name.age = 27;
console.log(name.age); // undefined
```

> 注意，原始类型的初始化可以只使用原始字面量形式。如果使用的是 new 关键字，则 JavaScript 会
> 创建一个 Object 类型的实例，但其行为类似原始值。  

```javascript
let name1 = "Nicholas";
let name2 = new String("Matt");
name1.age = 27;
name2.age = 26;
console.log(name1.age); // undefined
console.log(name2.age); // 26
console.log(typeof name1); // string
console.log(typeof name2); // object
```

#### 1.4.2 复制

原始值复制时会创建一个与原值一样的副本，按值保存，互不影响。

引用值复制时只复制内存地址(指针)，实际指向同一对象，在一个对象变量上修改属性会在另一个对象变量上体现出来。

#### 1.4.3 传递参数

函数参数都是按值传递，即在函数中会创建对应的局部变量复制传递进来的变量的值。

#### 1.4.4 类型确认

1. `typeof` ：判断一个变量是否为字符串、数值、布尔值或 undefined 的最好方式。如果值是对象或 null，则返回object
2. `instanceof `：如果变量是给定引用类型(原型)的实例，则 `instanceof` 操作符返回 true。  
3. `Object.prototype.toString.call()`：最可靠的方式，返回值为 `[object type]`格式的字符串， `type` 为需要判断的值的类型。

### 1.5 执行上下文与作用域

执行上下文（简称“上下文”），每个上下文都有一个关联的变量对象。

### 1.6 垃圾回收与内存管理

垃圾回收两种主要的标记策略：标记清理和引用计数。  

1. 标记清理：当变量进入上下文，比如在函数内部声明一个变量时，这个变量会被加上存在于上下文中的标记。  
2. 引用计数：对每个值都记录它被引用的次数。  

内存管理：将内存占用量保持在一个较小的值可以让页面性能更好。

优化内存占用的最佳手段就是保证在执行代码时只保存必要的数据，如果数据不再必要，那么把它设置为 `null`。即**解除引用**。

`ES6+`还可以使用 `let`、`const`来声明变量，也有助于垃圾回收过程。

## 2. 原型与原型链

### 2.1 原型

每个Object对象都有 `__proto__`属性，每个函数都有自己的 <code>prototype</code> (原型)属性。



每当创建一个**函数**时，都会为这个函数创建一个 `prototype` 属性（地址，指向这个函数的原型对象），每个原型对象自动获得一个 `constructor` 属性（地址，指向与这个函数关联的构造函数，普通函数也会指回原函数）。

```javascript
// 1. 构造函数
function Person(name) {
    this.name = name;
	this.sayName = function() {
        console.log(this.name);
    }
}

Person.prototype.constructor === Person; // true

// 2. 普通函数
function normalFunc() { 
    console.log("我是普通函数") 
}

normalFunc.prototype.constructor === normalFunc; // true
```



每当创建一个**对象**时，都会为这个对象创建一个 `__proto__` 的属性（地址，指向这个对象的构造函数的原型对象）。

```javascript
let mike = new Person("mike");

mike.__proto__ === Person.prototype; // true
mike.__proto__.constructor === Person; // true
```



使用同一构造函数创建的实例都会共用一个原型对象。

```javascript
let jack = new Person("jack");

jack.__proto__ === mike.__proto__; // true
jack.__proto__.constructor === Person; // true
```



每个函数或者对象的原型最终指向都是 `Object.prototype` ，也就是 `null` （一个空对象）。

```javascript
Person.prototype.__proto__ === Object.prototype; // true
mike.__proto__.__proto__ === Object.prototype; // true
jack.__proto__.constructor.prototype.__proto === Object.prototype; // true
```



