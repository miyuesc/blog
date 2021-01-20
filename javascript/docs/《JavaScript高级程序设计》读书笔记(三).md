# JavaScript高级程序设计读书笔记 ———— 函数

函数：实际上是对象，每个函数都是 `Function` 类型的实例，函数名就是指向函数对象的指针。

函数声明常用的有两种方式：函数形式和函数表达式

```javascript
// 函数形式
function sum(num1, num2) {
    return num1 + num2;
}

// 函数表达式
let sum = function(sum1, sum2) {
    return sum1 + sum2;
};
```

另外还有一种函数声明方式叫“**箭头函数**”

```javascript
let sum = (num1, num2) => {
	return num1 + num2;
};
```

> 还有一种使用 `Function` 构造函数的声明方式，不推荐使用。

## 1. 箭头函数

箭头函数是 `ES6` 新增的语法。

箭头函数的箭头后面可以不使用大括号，但是这样会改变函数的行为。有大括号说明包含“函数体”，可以在其中包含多条语句，与常规函数的内部一样’不使用大括号，后面就只能包含一行代码，并且会隐式返回这行代码的值。

> 注：箭头函数不能使用 `arguments`、`super` 和`new.target`，也不能用作构造函数。此外，箭头函数也没有 `prototype` 属性。

## 2. 函数名

函数名，指向函数对象的指针，与对象指针变量具有相同的行为。

```javascript
function sum(num1, num2) {
	return num1 + num2;
}
console.log(sum(10, 10)); // 20
let anotherSum = sum;
console.log(anotherSum(10, 10)); // 20
sum = null;
console.log(anotherSum(10, 10)); // 20
```

## 3. 参数

`ECMAScript` 不关心传入参数的个数，也不关心传入参数的数据类型。

所有以 `function` 关键字声明的函数，都可以在内部访问 `arguments` 对象，`arguments` 对象是一个类数组对象，可以使用中括号语法访问传入的第 `n` 个参数，也可以访问 `arguments.length` 属性来确定传入参数个数。

---

箭头函数中不能访问 `arguments` 对象，只能通过定义的命名参数访问。

> 函数的参数都是按值传递的，如果传入的参数是一个对象，则实际上传递的是对象的引用地址。

## 4. 没有重载

同名函数，后面定义的会覆盖之前的定义。

## 5. 参数默认值

`ES5.1` 之前，实现默认参数一般是在函数体中判断这个参数是否是 `undefined` ，如果是，则证明没有传入参数，就给它赋一个值作为默认值。

`ES6` 之后，可以显式的定义默认参数。

```javascript
function add(sum1, sum2 = 5) {
	return sum1 + sum2;
}

add(5); // 10
```

### 默认参数作用域和暂时性死区

函数设置的默认参数会根据顺序**依次**被初始化，所以后面定义默认值得参数可以引用先定义的参数，但是前面定义的参数不能引用后面的定义（**暂时性死区规则**）

```javascript
function makeKing(name = 'Henry', numerals = name) {
	return `King ${name} ${numerals}`;
}
console.log(makeKing()); // King Henry Henry

// 调用时不传第一个参数会报错
function makeKing(name = numerals, numerals = 'VIII') {
	return `King ${name} ${numerals}`;
}
```









