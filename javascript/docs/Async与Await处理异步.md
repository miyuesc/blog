# 一、概述

在`ES7`发布`async/await`语法之前，我们常用的有三种方式来解决异步问题：
1. Callback 嵌套回调函数，
2. Promise 链式回调，
3. Generator 生成器。

但是这三种方式都不够优雅，更有可能造成“回调地狱”，`ES7`对此做了优化，才有了`async/await`。
在此之前，首先对以往的三种方式做个简单介绍。

# 二、以往的三种异步解决方案

## 1. Callback 嵌套回调

Callback: A callback is a function that is passed as an argument to another function and is executed after its parent function has completed。

意为“将一个函数作为参数传入另一个函数中，当另一个函数执行完成之后再执行传入的函数”，这个过程就称为回调。在JavaScript中，回调函数具体的定义为： 函数A作为参数(函数引用)传递到另一个函数B中，并且这个函数B执行函数A。我们就说函数A叫做回调函数。如果没有名称(函数表达式)，就叫做匿名回调函数。

实现机制：
1. 定义一个回调函数 `function A()`；
2. 定义一个调用函数`function B(A())`,将函数A 的函数指针注册给函数B；
3. 当外部调用函数B时，函数B在主函数执行完成之后调用执行函数A。

我在是否上看到一个很浅显易懂的例子来说明异步问题：假设A向B询问一个问题，在B回答之后再继续问下一个问题，这个过程就是同步；假设A向B询问问题的时候，不等待B的回到就继续下一个问题，B思考后依次回答A提出过的问题，这个过程就是异步。

```javascript
// example：
fuction A(callback) {
	console.info("我是主函数");
	callback();
}
fuction B() {
	setTimeout(
		console.info("我是回调函数")
	, 1000)
}

// console result 输出结果
// 我是主函数
// 我是回调函数 (1s后输出)
```

这个时候，函数B的执行不会影响函数A主体的执行情况。但这种方式在多层嵌套的时候就会变得异常难受。

```javascript
// example:
function A(a) {
	let data = 1;
	setTimeout( function (data) {
		data += 1;
		setTimeout( function (data) {
			data += 1;
			setTimeout( function (data) {
				data += 1;
				...
			})
		})
	})
}
```

这种时候，多层嵌套所导致的问题就开始显现出来：语义不清晰、语法混乱、维护困难、不利于理解，即我们常说的回调地狱。

## 2. Promise 链式回调

> 摘自 "廖雪峰的官方网站" [戳此查看原文](https://www.liaoxuefeng.com/wiki/1022910821149312/1023024413276544) 

在JavaScript的世界中，所有代码都是单线程执行的。由于这个“缺陷”，导致JavaScript的所有网络操作，浏览器事件，都必须是异步执行。比如`ajax`就是典型的异步操作：

```javascript
request.onreadystatechange = function () {
    if (request.readyState === 4) {
        if (request.status === 200) {
            return success(request.responseText);
        } else {
            return fail(request.status);
        }
    }
}
```

把回调函数"`success(request.responseText)`"和"`fail(request.status)`"写到一个AJAX操作里很正常，但是不好看，而且不利于代码复用。

有没有更好的写法？比如写成这样：
```javascript
var ajax = ajaxGet('http://...');
ajax.ifSuccess(success)
    .ifFail(fail);
```

这种链式写法的好处在于，先统一执行AJAX逻辑，不关心如何处理结果，然后，根据结果是成功还是失败，在将来的某个时候调用`success`函数或`fail`函数。

之后ES 6 成功解决了这个问题，发布了Promise语法。

```javascript
// 生成一个0-2之间的随机数，如果小于1，则等待一段时间后返回成功，否则返回失败
function test(resolve, reject) {
    var timeOut = Math.random() * 2;
    log('set timeout to: ' + timeOut + ' seconds.');
    setTimeout(function () {
        if (timeOut < 1) {
            log('call resolve()...');
            resolve('200 OK');
        }
        else {
            log('call reject()...');
            reject('timeout in ' + timeOut + ' seconds.');
        }
    }, timeOut * 1000);
}
```

这个test()函数有两个参数，这两个参数都是函数，如果执行成功，我们将调用"resolve('200 OK')"，如果执行失败，我们将调用"`reject('timeout in ' + timeOut + ' seconds.')`"。可以看出，`test()`函数只关心自身的逻辑，并不关心具体的`resolve`和`reject`将如何处理结果。

有了执行函数，我们就可以用一个`Promise`对象来执行它，并在将来某个时刻获得成功或失败的结果：

```javascript
var p1 = new Promise(test);
var p2 = p1.then(function (result) {
    console.log('成功：' + result);
});
var p3 = p2.catch(function (reason) {
    console.log('失败：' + reason);
});
```

变量`p1`是一个Promise对象，它负责执行`test`函数。

```javascript
// 如果成功，执行这个函数：
p1.then(function (result) {
    console.log('成功：' + result);
});

// 如果失败，执行这个函数
p2.catch(function (reason) {
    console.log('失败：' + reason);
});
```

Promise对象可以串联起来，所以上述代码可以简化为：

```javascript
new Promise(test).then(function (result) {
    console.log('成功：' + result);
}).catch(function (reason) {
    console.log('失败：' + reason);
});
```

可见`Promise`最大的好处是在异步执行的流程中，把执行代码和处理结果的代码清晰地分离了。
`Promise`还可以做更多的事情，比如，有若干个异步任务，需要先做任务1，如果成功后再做任务2，任何任务失败则不再继续并执行错误处理函数。
要串行执行这样的异步任务，不用Promise需要写一层一层的嵌套代码。有了`Promise`，我们只需要简单地写：

```
job1.then(job2).then(job3).catch(handleError);
```

其中，`job1`、`job2`和`job3`都是`Promise`对象。

```javascript
example:

// 0.5秒后返回input*input的计算结果:
function multiply(input) {
    return new Promise(function (resolve, reject) {
        log('calculating ' + input + ' x ' + input + '...');
        setTimeout(resolve, 500, input * input);
    });
}

// 0.5秒后返回input+input的计算结果:
function add(input) {
    return new Promise(function (resolve, reject) {
        log('calculating ' + input + ' + ' + input + '...');
        setTimeout(resolve, 500, input + input);
    });
}

var p = new Promise(function (resolve, reject) {
    log('start new Promise...');
    resolve(123);
});

p.then(multiply)
 .then(add)
 .then(multiply)
 .then(add)
 .then(function (result) {
    log('Got value: ' + result);
});

// console info:
start new Promise...

// calculating 123 x 123...

// calculating 15129 + 15129...

// calculating 30258 x 30258...

// calculating 915546564 + 915546564...

// Got value: 1831093128
```

除了串行执行若干异步任务外，Promise还可以并行执行异步任务。
试想一个页面聊天系统，我们需要从两个不同的URL分别获得用户的个人信息和好友列表，这两个任务是可以并行执行的，用"Promise.all()"实现如下：

```
var p1 = new Promise(function (resolve, reject) {
    setTimeout(resolve, 500, 'P1');
});
var p2 = new Promise(function (resolve, reject) {
    setTimeout(resolve, 600, 'P2');
});
// 同时执行p1和p2，并在它们都完成后执行then:
Promise.all([p1, p2]).then(function (results) {
    console.log(results); // 获得一个Array: ['P1', 'P2']
});
```

有些时候，多个异步任务是为了容错。比如，同时向两个URL读取用户的个人信息，只需要获得先返回的结果即可。这种情况下，用"Promise.race()"实现：

```
var p1 = new Promise(function (resolve, reject) {
    setTimeout(resolve, 500, 'P1');
});
var p2 = new Promise(function (resolve, reject) {
    setTimeout(resolve, 600, 'P2');
});
Promise.race([p1, p2]).then(function (result) {
    console.log(result); // 'P1'
});
```

由于`p1`执行较快，`Promise`的`then()`将获得结果`'P1'`。`p2`仍在继续执行，但执行结果将被丢弃。
如果我们组合使用Promise，就可以把很多异步任务以并行和串行的方式组合起来执行。

## 3. Generator 生成器

`generator`（生成器）是`ES6`标准引入的新的数据类型。一个`generator`看上去像一个函数，但可以返回多次。

`generator`函数使用`function* xxx(){}`定义，调用这个生成器函数并不会马上执行其中的语句然后返回结果，而是返回一个迭代器对象（`iterator`），可以依次遍历Generator函数中的每一个状态。

调用`generator`对象有两种方法：

1. 不断调用该`generator`对象的`next()`方法

```javascript
// example:
function* funcA(num){
	var a=0;
	while(a < num) {
		yield a;
		a++;
	}
	return;
}

var b = funcA(3); // 调用funcA

b.next(); // {value: 0, done: false}
b.next(); // {value: 1, done: false}
b.next(); // {value: 2, done: false}
b.next(); // {value: undefined, done: true}
```

2. 直接使用"`for ... of`"循环迭代，这种方式不许用调用者判断是否"`done`"

```javascript
example:
function* funcA(num) {
	var a=0;
	while(a < num) {
		yield a;
		a++;
	}
	return;
}

function funcB() {
	for (var x of funcA(3)) {
    	console.log(x); // 依次输出0, 1, 2
	}
}
```

# 三、 `async/await`

在理解`async/await`的使用之前，我们先了解`async`与`await`的含义。
1. `async`函数是Generator函数的语法糖，使用关键字`async`表示，声明函数是异步执行的。
2. `await`意思的`async wait`，直译为“异步等待”，这个关键之只能在`async`函数中使用。
3. `async`函数必须在等待内部的所有`await`标识的`Promise`对象执行完成之后才会发生状态改变。

通过`async/await`可以使用同步思维解决异步问题。

## 1. `async` 函数

使用`async`关键字声明一个函数，表示该函数总会返回一个promise对象；如果函数中有"`return <non-promise>`"，那么JavaScript会自动将其封装到一个带有该值的`resolved promise`当中。

```javascript
// example:
async function a() {
  return "function a";
}

a().then(alert); // "function a"

// 也可以使用显式返回promise，结果跟上述方式相同
async function a() {
  return Promise.resolve("function a");
}

a().then(alert); // "function a"
```

## 2. await 关键字

`await`关键字只能在`async`函数中使用。

```javascript
async function a() {
  	setTimeout( () => {
  		console.info("function a");
  		return "function a end";
  	}, 1000)
}

async function b() {
	console.info(start);
	let result = await a();
	console.info("function b");
	console.info(result);
}

// console info
start
function a // 1s 后输出
function b
function a end
```

> 注意：**不能**在非`async` 定义的常规函数中使用`await`关键字，否则会产生语法错误。