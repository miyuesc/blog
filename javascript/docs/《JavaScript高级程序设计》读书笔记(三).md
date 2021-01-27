# 函数

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

## 6. 参数扩展和收集

### 6.1 扩展参数

ES6 之后可以使用扩展操作符实现，ES6 之前可以使用 `apply()` 方法。

```javascript
let values = [1, 2, 3, 4];
function getSum() {
    let sum = 0;
    for (let i = 0; i < arguments.length; ++i) {
    	sum += arguments[i];
    }
    return sum;
}

// apply
getSum.apply(null, values);
// 扩展操作符
getSum(...values);
```

### 6.2 收集参数

可以在定义函数的时候使用扩展操作符来将剩余参数用一个数组保存起来，没有剩余参数则会获取到一个空数组。

> 因为剩余参数长度可变，所以只能将其作为最后一个参数。

```javascript
function ignoreFirst(firstValue, ...values) {
    console.log(values);
}
ignoreFirst(); // []
ignoreFirst(1); // []
ignoreFirst(1,2); // [2]
ignoreFirst(1,2,3); // [2, 3]
```

## 7. 声明、函数表达式和函数作为参数

> JS 引擎在执行代码之前都会先读取函数声明，并在执行上下文中生成函数定义；但是使用函数表达式声明函数，则不会提前读取函数声明。

```javascript
// 没问题
console.log(sum(10, 10));
function sum(num1, num2) {
	return num1 + num2;
}

// 会出错 Uncaught ReferenceError: sum is not defined
console.log(sum(10, 10));
let sum = function(num1, num2) {
    return num1 + num2;
}
```

因为函数名就是变量，所以可以将一个函数作为参数传递给另外一个函数，或者在一个函数中返回另一个函数（高阶函数）。

## 8. 函数内部

### 8.1 augments

一个类数组对象，包含调用函数时传入的所有参数。

> 只有以 function 关键字定义函数（相对于使用箭头语法创建函数）时才会有。

`augments` 还有一个属性 `callee`（严格模式不能访问） ，指向 `arguments` 对象所在的函数。

### 8.2 this

在标准函数中，this 引用的是把函数当成方法调用的上下文对象。

> this 只有在函数被调用的时候才能被确认，指向最后调用函数的那个对象。

### 8.3 caller

指向调用当前函数的函数，如果是在全局作用域中调用的则为 `null`。

### 8.4 new.target

检测函数（常用于构造函数）是否使用 new 关键字调用。

正常调用时值为 `undefined` ，使用 `new` 关键字则指向被调用的构造函数。

## 9. 递归

递归函数通常的形式是一个函数通过名称调用自己。

使用经典的递归函数声明方式声明一个递归函数时，不能将这个函数赋值给其他变量和销毁这个函数名引用。

要解决这个问题可以使用命名函数表达式或者使用 `arguments.callee` （严格模式下不能使用）来解决。

```javascript
function factorial(num) {
    if (num <= 1) {
    	return 1;
    } else {
    	return num * arguments.callee(num - 1);
    }
}

const factorial = (function f(num) {
    if (num <= 1) {
    	return 1;
    } else {
    	return num * f(num - 1);
    }
});
```













