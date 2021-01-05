> 基于第四版

## 1. 基本引用类型

### 1.1 Date

创建日期对象，使用 `new` 调用 `Date()` 构造函数： `let now = new Date()`

Date 类型重写了 `toLocaleString()`、 `toString()`和 `valueOf()`方法。

- `toLocaleString()`：返回与浏览器运行的本地环境一致的日期和时间
- `toString()`：返回带时区信息的日期和时间
- `valueOf()`：返回日期的毫秒表示

> `toLocaleString()`返回值的具体格式可能因浏览器而不同，所以一般不直接用于显示。

### 1.2 RegExp

#### 1.2.1 基础属性

`ECMAScript` 通过 `RegExp` 类型支持正则表达式。

正则表达式使用类似 Perl 的简洁语法来创建：
`let expression = /pattern/flags;`
这个正则表达式的 `pattern`（模式）可以是任何简单或复杂的正则表达式，包括字符类、限定符、分组、向前查找和反向引用。  

匹配模式标记有：

- `g`：全局模式，表示查找字符串的全部内容，而不是找到第一个匹配的内容就结束。
- `i`：不区分大小写，表示在查找匹配时忽略 `pattern` (模式)和字符串的大小写。
- `m`：多行模式，表示查找到一行文本末尾时会继续查找。
- `y`：粘附模式，表示只查找从 `lastIndex` 开始及之后的字符串。
- `u`： Unicode 模式，启用 Unicode 匹配。
- `s`： `dotAll` 模式，表示元字符，匹配任何字符（包括\n 或\r）。  

元字符有：`( [ { \ ^ $ | ) ] } ? * + .  `

> 元字符在正则表达式中都有一种或多种特殊功能，所以要匹配上面这些字符本身，就必须使用反斜杠来转义  

#### 1.2.2 构造函数属性

|   全名   |   简写   |   说明   |
| ---- | ---- | ---- |
|   `input`   |   `$_`   |   最后搜索的字符串（非标准特性）   |
| `lastMatch`  |   `$&`   |   最后匹配的文本   |
|   `lastParen`   |   `$+`   |   最后匹配的捕获组（非标准特性）   |
|   `leftContext`   |   `$``   |   `input` 字符串中出现在 `lastMatch` 前面的文本   |
|   `rightContext`   |   `$'`   |   `input` 字符串中出现在 `lastMatch` 后面的文本   |

### 1.3 原始值包装类型

为了方便操作原始值， ECMAScript 提供了 3 种特殊的引用类型： Boolean、 Number 和 String。

### 1.4 单例内置对象

1. `Global`：在全局作用域定义的变量和函数都会成为 `Global` 对象的属性。
2. `Math`：作为保存数学公式、信息和计算的地方

## 2. 集合引用类型

### 2.1 Object

Object 是 `ECMAScript` 中最常用的类型之一。虽然 Object 的实例没有多少功能，但很适合存储和在应用程序间交换数据。

### 2.2 Array

除了Object，Array应该就是最常用的引用类型了。

#### 2.2.1 创建

1. 构造函数：`let arr = new Array();`
2. 数组字面量：`let values = [1, 2, 3];`
3. `Array.form()`(`ES6`新增)：第一个参数是一个类数组对象，即任何可迭代的结构，或者有一个 length 属性和可索引元素的结构
4. `Array.of()`(`ES6`新增)：可以把一组参数转换为数组

```javascript
// 1. 构造函数
let colors = new Array();
let colors = new Array(20); // [undefined, undefined, undefined ... undefined]
let colors = new Array("red", "blue", "green"); // ["red", "blue", "green"]

// 2. 字面量表示法
let colors = ["red", "blue", "green"]; // 创建一个包含 3 个元素的数组
let names = []; // 创建一个空数组

// 3. Array.form()
console.log(Array.from("Matt")); // ["M", "a", "t", "t"]
// Array.from()对现有数组执行浅复制
const a1 = [1, 2, 3, 4];
const a2 = Array.from(a1);
console.log(a1); // [1, 2, 3, 4]
console.log(a1 === a2); // false
// Array.from()还接收第二个可选的映射函数参数。
const a1 = [1, 2, 3, 4];
const a2 = Array.from(a1, x => x**2);
console.log(a2); // [1, 4, 9, 16]

// 4. Array.of() 通常用来转换函数参数的arguments类数组
console.log(Array.of(1, 2, 3, 4)); // [1, 2, 3, 4]
console.log(Array.of(undefined));  // [undefined]
```

> 与对象一样，在使用**字面量表示法**创建数组**不会**调用 Array 构造函数。

#### 2.2.2 检测

1. `instanceof Array  `
2. `Array.isArray()`

#### 2.2.3 迭代器方法

在 `ES6` 中， Array 的原型上暴露了 3 个用于检索数组内容的方法： `keys()`、 `values()`和`entries()`。 `keys()`返回数组索引的迭代器， `values()`返回数组元素的迭代器，而 `entries()`返回索引/值对的迭代器：

```javascript
const a = ["foo", "bar", "baz", "qux"];
// 因为这些方法都返回迭代器，所以可以将它们的内容
// 通过 Array.from()直接转换为数组实例
const aKeys = Array.from(a.keys());
const aValues = Array.from(a.values());
const aEntries = Array.from(a.entries());
console.log(aKeys); // [0, 1, 2, 3]
console.log(aValues); // ["foo", "bar", "baz", "qux"]
console.log(aEntries); // [[0, "foo"], [1, "bar"], [2, "baz"], [3, "qux"]]
```

#### 2.2.4 复制和填充

批量复制方法 `copyWithin()`，以及填充数组方法 `fill()`  

#### 2.2.5 其他方法

1. 栈方法： 末尾（栈顶部）插入`push()`、末尾（栈顶部）移除`pop()`并返回被移除项
2. 队列方法：开头移除（出队）`shift()`并返回被移除项，末尾插入（入队）`push()`
3. 排序方法：反向排列 `reverse()`，`sort()`默认升序排列（可以接收一个比较函数）
4. 操作方法：
   - 组合多个数组 `concat()`
   - 创建一个包含原有数组中一个或多个元素的新数组 `slice()`
   - 删除、插入、替换方法 `splice()`
5. 检索方法：
   - `indexOf()`：严格相等，从头开始查找，返回元素位置下标或者`-1`(未找到)
   - `lastIndexOf()`：严格相等，从末尾开始查找，返回元素位置下标或者`-1`(未找到)
   - `includes()`：严格相等，从头开始查找，返回布尔值
   - `find()`：返回第一个匹配的元素
   - `findIndex()`：返回第一个匹配元素的索引
6. 迭代方法：
   - `every()`：对数组每一项都运行传入的函数，如果对每一项函数都返回 true， 则这个方法返回 true。
   - `filter()`：对数组每一项都运行传入的函数，函数返回 true 的项会组成数组之后返回。
   - `forEach()`：对数组每一项都运行传入的函数，没有返回值
   - `map()`：对数组每一项都运行传入的函数，返回由每次函数调用的结果构成的数组。
   - `some()`：对数组每一项都运行传入的函数，如果有一项函数返回 true，则这个方法返回 true。
7. 归并方法：
   - `reduce()`：从数组第一项开始遍历到最后一项。
   - `reduceRight()`：从最后一项开始遍历至第一项。













## 函数表达式

函数定义的两种方式：函数声明，函数表达式。

函数声明的语法形式 <code>function fn(arg0, arg1) {}</code>。

函数表达式语法形式 <code>var fn = function(arg1, arg2) {}</code>。

> 函数声明存在<b>函数声明提升</b>：在执行代码之前会先读取函数声明，表示可以将函数声明放在调用他的语句之后。

> 注：使用函数表达式声明函数，在使用前必须先赋值（调用函数之前）。

```javascript
sayHi();    //错误：函数还不存在 
var sayHi = function(){ 
    alert("Hi!"); 
};
```

### 递归

递归函数是在一个函数通过名字调用自身的情况下构成的。

```javascript
function factorial(num) {
	if (num <= 1) {
        retrun 1;
    } else {
        retrun num * factorial(num - 1);
    }
}
```

这是一个经典的地归阶乘函数。但是这个函数有可能会出现下面的问题。

```javascript
var newFac = factorial;
factorial = null;
alert(newFac(4)); // 报错！
```

因为<code>newFac</code>中保存了<code>factorial()</code>函数，将`factorial`变量设置为null，会导致后面在执行`newFac()`时会调用<code>factorial()</code>，但此时<code>factorial</code>已经不再是一个函数了。

这种情况可以用`arguments.callee`解决。

```javascript
function factorial(num) {
    if (num <= 1) {
        return 1;
    } else {
        return num * arguments.callee(num - 1);
    }
}
```

使用 `arguments.callee()` 可以代替函数名，已确保无论怎么调用函数都不会出错。

但是在严格模式下使用脚本直接访问 `arguments.callee` 属性会导致错误，可以使用命名函数表达式来达成相同的结果。

```javascript
var factorial = (function f(num){ 
    if (num <= 1){  
        return 1; 
    } else { 
        return num * f(num-1); 
    } 
});
```

### 闭包

**闭包是指有权访问另一个函数作用域中的变量的函数。**

```javascript
function createComparisonFunction(propertyName) {     
    return function(object1, object2){ 
        var value1 = object1[propertyName]; // 1
        var value2 = object2[propertyName]; // 2
         
        if (value1 < value2){ 
            return -1; 
        } else if (value1 > value2){ 
            return 1; 
        } else { 
            return 0; 
        } 
    }; 
} 
```

这段代码中标记的这两行代码，访问了外部函数中的变量 `propertyName` 。

> 当函数被调用时，会创建一个执行环境（execution context）以及对应的作用域链，然后使用 `arguments` 和其他命名参数的值来初始化函数的活动对象（activation object，AO）。在作用域链中，外部函数的活动对象始终处于第二位，外部函数的外部函数的活动对象处于第三位，直到全局执行环境。

