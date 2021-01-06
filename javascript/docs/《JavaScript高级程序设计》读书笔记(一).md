
## 1. 目录结构

- 一、JavaScript简介
- 二、在HTML中使用JavaScript
- 三、基本概念
- 四、变量、作用域和内存问题
- 五、引用类型
- 六、面向对象的程序设计
- 七、匿名函数
- 八、BOM
- 九、客户端检测
- 十、DOM
- 十一、DOM2和DOM3
- 十二、事件
- …

由于章节较多，只记录本人认为的基础等部分。

## 2. 什么是JavaScript

诞生于1995年，早期设计只是为了实现表单验证。

#### 发展史

> 1. Nombas公司：C-minus-minus（Cmm）——可取代宏、与C和C++相似，后改名ScriptEase；
> 2. NetSpace公司：LiveScript => JavaScript1.0，主要实现表单验证
> 3. 微软：在IE 3中加入JScript
> 4. 1998年，ISO/IEC正式采用ECMAScript作为标准。

#### 实现

完整的JavaScript实现包含三个不同部分：1. 核心（ECMAScript），2. 文档对象模型（DOM），3. 浏览器对象模型（BOM）。

- ECMAScript：提供核心语言功能；
- DOM：提供访问和操作网页内容的方法和接口；
- BOM：提供与浏览器交互的方法和接口。



## 3. 使用JavaScript

#### 引入：在HTML页面中插入<code><srcipt></code>元素

按照惯例，所有script标签都应该放在页面的<code><head></code>元素里面，但这也意味着必须在所有script加载完毕之后才呈现页面内容，这样无疑会造成很长的窗口空白期，于是可以将script放在body元素当中。



## 4. 基本概念

1. 区分大小写：在ES中，所有的一切都区分大小写，这与html是有区别的，html标签与属性不区分大小写，所以一般用下划线“_”或者连字符“-”；
2. 标识符：函数、变量、属性的名字；
3. 注释和语句；
4. 关键字和保留字；
5. 变量；
6. 数据类型；
7. 操作符；
8. 语句；
9. 函数。



### 4.1 变量

ECMAScript中变量是松散类型，可以用来保存任何类型的数据（这点在TypeScript中有很大改变）。

定义变量时使用var操作符（ES6之后又引入了let，const）。

var：没有块的概念，ES5之前只有全局变量与函数内的局部变量，全局作用域内声明的变量所有作用域内都可以访问，函数内声明的局部变量可以在全局作用域内访问，但不能跨函数访问。

let：ES6之后引入的块的概念，使用let声明的变量只在变量所在的{}块内访问。

const：ES6之后引入的关键字，用来声明常量，声明时必须初始化，且不能改变，只能在常量所在的{}内访问。

> 注意：如果使用const声明了一个对象，仅代表const声明的这个对象的指针不会改变，但对象内部的值可以做改变。这点与Object对象的数据类型有关。



### 4.2 数据类型

ES中包含5种简单数据类型（基本数据类型）与一众复杂数据类型。

简单类型：Undefined（未定义）、Null（空）、Boolean（布尔类型）、Number（数字）、String（字符串），Symbol（后来添加）

复杂类型：Object（对象），Array（数组），Function（函数）



### 4.3 语句

使用一个或者多个关键字来完成给定任务。

包含：if语句，do-while语句，while语句，for语句，for-in语句，label语句，break/continue语句，with语句，switch语句。

> for-in语句：一众精准的迭代语句，用来枚举对象的属性。常用语法为：
>
> <code>for (property in expression) statement</code>
>
> *建议在使用for-in语法之前先检测该对象的值是否为null或者undefined*

> break/continue语句：用于在循环中精确的控制代码的执行。break立即退出该循环，执行循环后的语句；continue立刻退出当次循环，返回循环顶部继续执行。



### 4.4 函数

所有语言的核心概念，通过函数封装任意多条语句，并且可以在任何时候、任何地方调用执行。ES中使用关键字<b>function</b>声明函数。

> 基本语法：
>
> ```javascript
> function functionName(arg0, arg1,...,argN) {
>  	statements
> } 
> ```

<b>函数会在执行完return后立即停止并退出。</b>

> *推荐始终让函数有返回值，或者一直没有返回值（会默认返回 undefined）*
>
> 严格模式：
>
> - 不能把函数命名为eval或者argments；
> - 不能把参数命名为eval或者argments；
> - 不能出现同名参数。

#### 4.4.1 参数

<b>ECMAScript 函数不介意传递进来多少个参数，也不在乎传进来参数是什么数据类型。</b>

因为所有传进来的参数在函数中用一个数组保存，在函数体内，也可以通过argments对象来访问这个参数数组

#### 4.4.2 没有重载

如果定义了两个名字相同的函数，则该名字只属于后定义的函数。



## 5. 变量、作用域和内存问题

### 5.1 基本类型与引用类型的值

ES包含两种数据类型值：基本类型值（简单的数据段）和引用类型值（保存在内存中的对象）。

> 复制这个引用类型时，复制的是这个内存中的对象的引用；但是在对其做添加或删除属性的时候，操作的是实际的对象而不是这个对象的引用——笔者注

<b>参数传递</b>

ES中所有函数的参数都是按值传递的。

<font color="pink">向函数传入基本类型值时，函数会复制该值给一个局部变量（参数），函数内部改变不影响外部变量的值。</font>

<font color="pink">向函数传入引用类型值时，函数会将该引用复制给一个局部变量（参数），但是在函数中改变该引用的引用类型值时，会反应在函数的外部，即函数改变了保存在内存中的对象的属性；若在函数内部对参数重新定义一个对象，则该变量的引用会改变，指向内存中新定义的对象，函数后续使用参数进行操作，将不会再体现在函数的外部</font>

```javascript
// example-1
function addTen(number) {
    number += 10;
    return number;
}
var num = 1;
var result = addTen(num);

console.log(num); // 1,无变化
console.log(result); // 11

// example-2
function setName(obj) {
    obj.name = "Jhon";
    return obj;
}
var person = new Object();
setName(person);
console.log(person.name); // "Jhon"

// example-3
function setName(obj) {
    obj.name = "Jhon";
    obj = new Object(); // 指向新的对象的引用，函数执行完后立即被销毁
    obj.name = "Mike"; // 改变新的对象的属性
}
var person = new Object();
setName(person);
console.log(person.name); // "Jhon"
```



### 5.2 执行环境和作用域

<b>执行环境</b>（简称“<b>环境</b>”）,定义了变量或者函数是否有权访问其他数据，决定了他们各自的行为。

> 内部环境可以通过作用域链访问所有的外部环境，但外部环境不能访问内部环境中的任何变量和函数。这些环境之间的联系是线性、有次序的。每个环境都可以向上搜索作用域链，以查询变量和函数名；但任何环境都不能通过向下搜索作用域链而进入另一个执行环境。

#### 5.2.1 延长作用域链

在作用域链的前端临时增加一个变量对象，该变量对象会在代码执行后被移除。

可以用来延长作用域链的有两种情况：

- try-catch语句的catch块；
- with语句

#### 5.2.2 没有块级作用域

使用var声明的变量，会自动被添加到最接近的环境中。

> 在ES6有新增let、const来优化这类问题。



## 6. 引用类型

引用类型的值（对象）是引用类型的一个实例。在 ECMAScript 中，引用类型是一种数据结构，用于将数据和功能组织在一起，也被称为“类”。

> ES技术上是一门面向对象的语言，但是不具备面向对象语言所支持的接口和类等基本结构。

<b>对象是某个特定引用类型的实例</b>



### 6.1 Object类型

ES中使用最多的引用类型。创建Object实例有两种方式：

1. new操作符后跟Object构造函数：<code>var obj = new Object();</code>
2. 使用<u>对象字面量</u>表示法（目前最常用的方式）：

```javascript
var person = {
	name: "Jhon",
	age: 28
}
```

==使用对象也是向函数传递大量不定参数的首选方式：==

```javascript
function printArgs(args) {
	if (args.name && typeof args.name === "string") {
		console.log("person's name is" + args.name);
        return args.name;
	}
	if (args.age && typeof args.age === "number") {
		console.log("person's age is" + args.age);
        return args.age;
	}
    return null;
}
printArgs({
	name: "Jhon",
	age: 28
})
printArgs({
	name: "Jhon"
})
```



### 6.2 Array类型

ES中，Array类型应该是Object之后最常用的类型。

> 特性：数组内部每一项都可以保存任何类型的数据；大小可以动态调整，可以根据数据变化自动增长。

*数组的length属性不是只读的*

数组检测：ES5中新增了<code>Array.isArray()</code>方法。

```javascript
if (Array.isArray(value)){ 
    //对数组执行某些操作 
} 
```

数组常用方法如下：

![数组](http://ww1.sinaimg.cn/large/0067sbCSly1g6c0kqslixj314j3g5apt.jpg)



### 6.3 RegExp类型

ES通过RegExp来支持正则表达式，使用方式：<code>var expression = / pattern / flags ;</code>

> 1. g： 表示全局（global）模式，启用表示匹配所有字符串而非匹配到第一个后立即退出
> 2. i：表示不区分大小
> 3. m：表示多行，即在到达一行末尾时会继续

```javascript
// 匹配字符串中所有"at"的实例 
var pattern1 = /at/g;

// 匹配第一个"bat"或"cat"，不区分大小写
var pattern2 = /[bc]at/i;

// 匹配所有以"at"结尾的 3 个字符的组合，不区分大小写
var pattern3 = /.at/gi;

// 匹配所有"bat"或"cat"，不区分大小写
var pattern4 = /[bc]at/gi;

// 匹配第一个" [bc]at"，不区分大小写
var pattern5 = /\[bc\]at/i;

// 匹配所有以"at"结尾的 3 个字符的组合，区分大小写
var pattern6 = /.at/g;
```



### 6.4 Function类型

> 函数实际上是对象，每个函数都是Function类型的实例。



## 7. 面向对象程序设计

面向对象的语言都有一个标志：都有类的概念，通过类可以创建任意多个具有相同属性和方法的对象。ES中没有类的概念，因此它的对象也与基于类的语言中的对象不同。

<u>对象：无序属性的几个，其属性可以包含基本值、对象挥着函数。</u>



### 7.1 理解对象

创建自定义对象最简单的方式就是创建一个Object实例，然后再为他添加属性和方法。

<b>属性类型：数据属性、访问器属性</b>

#### 数据属性

数据属性：包含一个数据值的位置，在这个位置可以读取值和写入值。有四个描述其行为的特性。

- <code>[[Configerable]]</code>：表示能否通过delete删除属性从而重新定义属性、能否修改属性的特性，或者能否把属性修改为访问器属性；默认为<u>true</u>。
- <code>[[Enumerable]]</code>：表示能否通过for-in循环返回属性；默认为<u>true</u>。
- <code>[[Value]]</code>：包含这个属性的数据值；默认为<u>undefined</u>。
- <code>[[Writeable]]</code>：表示能否修改属性的值；默认为<u>true</u>。

#### 访问器属性

访问器属性不包括数据值：他们包含一对getter和setter函数（不过这两个函数都不是必须的）。读取访问器属性时，调用getter方法，返回有效的值；写入访问器属性时，会调用setter函数并传入新值，setter函数负责如何处理函数。访问器属性也有四个属性描述其属性。

- <code>[[Configurable]]</code>：与数据属性的Configurable属性相同。
- <code>[[Enumerable]]</code>：与数据属性的Configurable属性相同。
- <code>[[Get]]</code>：读取属性时调用的函数，默认为undefined。
- <code>[[Set]]</code>：写入属性时调用的函数，默认为undefined。



### 7.2 创建对象

#### 工厂模式

抽象出具体对象的过程。

```javascript
function createPerson(name, age, job){ 
    var o = new Object(); 
    o.name = name; 
    o.age = age; 
    o.job = job; 
    o.sayName = function(){ 
        alert(this.name); 
    };     
    return o; 
} 
 
var person1 = createPerson("Nicholas", 29, "Software Engineer"); 
var person2 = createPerson("Greg", 27, "Doctor");
```

#### 构造函数模式

```javascript
function Person(name, age, job){ 
    this.name = name; 
    this.age = age; 
    this.job = job; 
    this.sayName = function(){ 
        alert(this.name); 
    };     
} 
 
var person1 = new Person("Nicholas", 29, "Software Engineer"); 
var person2 = new Person("Greg", 27, "Doctor");
```

> 按照惯例，构造函数都以大写字母开头。

要创建Person的新实例，必须要用new操作符，这种方式调用构造函数会经历一下四个步骤：

1. 创建一个新对象；
2. 将构造函数的作用域赋给新对象（因此 this 就指向了这个新对象）；
3. 执行构造函数中的代码（为这个对象添加新的属性）；
4. 返回新的对象。

> *任何函数，只要通过new操作符来调用，都可以作为构造函数*；<br/>
> <b>构造函数不使用new操作符调用，则会将结果添加到window中</b><br/>
> <code>Person("Greg", 27, "Doctor"); // 添加到 window</code><br/>
> <code>window.sayName(); //"Greg"</code>

<b>缺点：</b><u>每个方法都要在每个实例上重新创建一遍</u>。

<b>解决方法：</b><u>将函数定义转移到构造函数之外</u>。

```javascript
function Person(name, age, job){ 
    this.name = name; 
    this.age = age; 
    this.job = job; 
    this.sayName = sayName; 
} 
 
function sayName(){ 
    alert(this.name); 
} 
 
var person1 = new Person("Nicholas", 29, "Software Engineer"); 
var person2 = new Person("Greg", 27, "Doctor");
```

这个例子中，将sayName()函数的定义转移到构造函数Person外部，在构造函数内部，将sayName属性设置成等于全局的sayName()函数，即内部的sayName属性只保存了一个指向全局sayName()函数的指针（引用）。

这种方式带来的问题：1.全局作用域内定义的函数只能被某个对象调用；2.如果对象有多个方法，那么这个自定义的引用类型就没有封装意义。

####  原型模式

每个Object对象都有<code>__Proto__</code>属性，每个函数都有自己的<code>prototype</code>(原型)属性，这个属性是一个指针，指向函数对应的原型对象。使用原型对象的好处是可以让所有对象实例共享他的属性和方法。

``````javascript
function Person() {}
Person.prototype.name = "Mike";
Person.prototype.age = 18;
Person.prototype.sayName = function() {
    alert(this.name);
}
var person1 = new Person();
var person2 = new Person();
person1.sayName(); // Mike
person2.sayName(); // Mike
alert(person1.sayName == person2.sayName); // true

Person.prototype == person1.[[Prototype]] == person2.[[Prototype]] == Person.Prototype.constructor
``````

<b>可以通过对象实例访问原型中的值，但是不能重写原型的值和属性</b>如果在实例中添加了一个属性且与原型属性同名，则会屏蔽原型中的值。

```javascript
function Person() {}
Person.prototype.name = "Mike";
Person.prototype.sayName = function() {
    console.log(this.name);
}
var person1 = new Person();
var person2 = new Person();
person1.name = "Jok";
console.log(person1.name); // Jok ---- 来自实例
console.log(person2.name); // Mike ---- 来自原型
```

当在函数中调用person1这个实例时，首先搜索这个实例，如果没有在搜索原型。当实例中存在这个属性时，即使设置为null也不会恢复指向原型。使用delete可以完全删除这个实例属性。

```javascript
person1.name = "Grey";
console.log(person1.name); // "Grey" ---- 来自实例
console.log(person1.name); // "Mike" ---- 来自原型
delete person1.name;
console.log(person1.name); // "Mike" ---- 来自原型
```

*使用<code>hasOwnProperty()</code>方法可以检测一个属性是否存在于实例中。只有给定属性存在于对象实例中时才会返回<code>true</code>*

```javascript
function Person() {}
Person.prototype.name = "Mike";
var person1 = new Person();
person1.hasOwnProperty("name"); // false
person1.name = "Jok";
person1.hasOwnProperty("name"); // true
delete person1.name;
person1.hasOwnProperty("name"); // false
```

<b>in操作符</b>

in操作符有两种使用方式：单独使用、在for-in循环中使用。

单独使用时，只要能通过对象访问到给定属性即返回true，不管这个属性时在实例总还是在原型中。

```javascript
var person3 = new Person();
var person4 = new Person();
person3.name = "Jok";
console.log("name" in person3); // true
console.log("name" in person4); // true
```

for-in循环时，返回所有可被枚举的属性，不管属性是存在于实例中还是原型中（即屏蔽了[[enumerable]]为false的属性）。

<b>简化原型语法</b>

```javascript
function Person(){ 
} 
Person.prototype = { 
    name : "Nicholas", 
    age : 29, 
    job: "Software Engineer", 
    sayName : function () { 
        alert(this.name); 
    } 
};
```

#### 组合模式

函数模式定义属性，原型模式定义方法与共享属性（目前在ES中使用最广泛，认同度最高的一宗自定义类型的方法）。

```javascript
function Person(name, age, job){
	this.name = name;     
    this.age = age;     
    this.job = job;     
    this.friends = ["Shelby", "Court"]; 
}  
Person.prototype = {     
    constructor : Person,     
    sayName : function(){
        alert(this.name);     
    } 
}  
var person1 = new Person("Nicholas", 29, "Software Engineer");
var person2 = new Person("Greg", 27, "Doctor"); person1.friends.push("Van"); 
alert(person1.friends);    //"Shelby,Count,Van" 
alert(person2.friends);    //"Shelby,Count" 
alert(person1.friends === person2.friends);    //false
alert(person1.sayName === person2.sayName);    //true
```

#### 动态原型模式

在构造函数中插入判断条件，只有在被检测方法不存在时，才会创建新的属性或者方法。

#### 寄生构造函数模式

通常是在前述几种情况都不适用的情况下，可以使用该模式。

基本思想是创建一个函数，但是该函数的作用仅仅是封装创建对象的代码。

```javascript
function Person(name, age, job){ 
    var o = new Object(); 
    o.name = name;
    o.sayName = function(){ 
        alert(this.name); 
    };     
    return o; 
} 
 
var friend = new Person("Nicholas", 29, "Software Engineer"); 
friend.sayName();  //"Nicholas" 
```

> 这个模式可以在特殊情况下用来为对象创建构造函数。

```javascript
function SpecialArray(){ 
    //创建数组 
    var values = new Array(); 
    //添加值 
    values.push.apply(values, arguments); 
    //添加方法 
    values.toPipedString = function(){ 
        return this.join("|"); 
    }; 
    //返回数组 
    return values; 
} 
 
var colors = new SpecialArray("red", "blue", "green"); 
alert(colors.toPipedString()); //"red|blue|green"
```

#### 稳妥构造函数模式

稳妥对象：没有公共属性，其方法也不能引用this的对象。

稳妥对象适合用在一些安全的环境中（禁止使用this和new），或者在放在数据被其他应用程序改动时使用。

### 7.3 继承

#### 原型链

ES中描述了原型链的概念，并将原型链作为实现继承的主要方法。

基本思想：利用原型让一个引用类型继承另一个引用类型的属性和方法。

每个构造函数都有一个原型对象，原型对象包含一个指向构造函数的指针，而实例都好汉一个指向原型对象内部的指针。

```javascript
function SuperType(){ 
    this.property = true; 
} 
SuperType.prototype.getSuperValue = function(){ 
    return this.property; 
}; 
 
function SubType(){ 
    this.subproperty = false; 
} 
 
//继承了 SuperType 
SubType.prototype = new SuperType(); 
 
SubType.prototype.getSubValue = function (){ 
    return this.subproperty; 
}; 
 
var instance = new SubType(); 
alert(instance.getSuperValue());      //true 
```

该代码定义两个类型：SuperType和SubType。每个类型对应一个属性和方法。

SubType继承SuperType，该继承通过创建SuperType实例，并将实例赋值给SubType.prototype实现。本质是重写原型对象，替换厂一个新的类型的实例。

<b>即本来存在于SuperType的实例的所有方法和属性，也存在于SubType.prototype中了。</b>

- 别忘记默认的原型

所有函数的默认原型都是Object实例，因此默认原型中都会包含一个内部指针指向Object.prototype。

- 确认原型和实例的关系

第一种方式是使用<code>instanceof</code>操作符,第二种是使用<code>isPrototypeOf()</code>方法。

```javascript
alert(instance instanceof Object);         //true 
alert(instance instanceof SuperType);      //true 
alert(instance instanceof SubType);        //true 

alert(Object.prototype.isPrototypeOf(instance));         //true 
alert(SuperType.prototype.isPrototypeOf(instance));      //true 
alert(SubType.prototype.isPrototypeOf(instance));        //true 
```

由于原型链的关系，我们可以说instance是Object，SuperType，SubType中任何一个的类型的实例。

- 谨慎地定义方法

子类型有时候需要重写超类型中的某个方法，或者需要添加超类型中不存在的某个方法。但不管怎样，**给原型添加方法的代码一定要放在替换原型的语句之后**。

- 原型链的问题

构造函数定义了一个引用类型值属性时，通过原型链继承的新类型创建的实例会共享这一个引用类型的值；在创建子类型的实例时，不能向超类型的构造函数中传递参数。

#### 借用构造函数

为解决原型中包含引用类型值所带来的问题（又叫**伪造对象**或者**经典继承**）。

基本思想：在子类型构造函数内部调用超类型构造函数，可以通过`call()`和`apply()`方法。

```javascript
function SuperType(){ 
    this.colors = ["red", "blue", "green"]; 
} 
 
function SubType(){   
    //继承了 继承了 SuperType 
    SuperType.call(this); 
} 
 
var instance1 = new SubType(); 
instance1.colors.push("black"); 
alert(instance1.colors);    //"red,blue,green,black" 
 
var instance2 = new SubType(); 
alert(instance2.colors);    //"red,blue,green" 
```

1. 传递参数

借用构造函数可以在子类型构造函数中向超类型构造函数传递参数。

```javascript
function SuperType(name){ 
    this.name = name; 
} 
 
function SubType(){   
    //继承了 SuperType，同时还传递了参数 
    SuperType.call(this, "Nicholas"); 
     
    //实例属性 
    this.age = 29; 
} 
 
var instance = new SubType(); 
alert(instance.name);    //"Nicholas"; 
alert(instance.age);     //29
```

2. 问题

方法都在构造函数中定义，无法实现函数复用，而且超类型的原型中定义的方法对子类型也不可见。

#### 组合继承

也叫伪经典继承，将原型链和借用构造函数的技术组合到一起。

> ES中最常用的继承模式。

#### 其他继承

1. 原型式继承：在函数内部创建一个新的临时性构造函数，将传入参数作为内部构造函数的原型，最后返回这个临时函数的新类型。本质对传入对象执行了一次浅拷贝。
2. 寄生式继承
3. 寄生组合式继承

