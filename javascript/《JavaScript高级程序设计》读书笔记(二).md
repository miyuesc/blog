

## 1. 函数表达式

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

### 1.1 递归

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

### 1.2 闭包

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

