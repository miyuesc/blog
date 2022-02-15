# JavaScript高程笔记——客户端存储

> 现在越来越多的网站是动态网站，常常需要将后端数据传输给前端保存或者更新到页面中，尤其是用户偏好设置，保存在客户端不仅可以减少请求耗时，也能降低服务端的压力。

客户端（这里一般指浏览器）目前主要包括三类存储方式：cookie， Web Storage 和 IndexedDB。其中 Web Storage 又包含 Local Storage 和 Session Storage。

（现在主流浏览器还支持 Web SQL，这里暂时不做介绍...主要是不大了解）

## 1. cookie

cookie，全名叫 HTTP cookie，是第一个客户端存储解决方案，最初用于在客户端存储回话信息。后来主要用在三个方面：

- 会话状态管理（如用户登录状态、购物车、游戏分数或其它需要记录的信息）
- 个性化设置（如用户自定义设置、主题等）
- 浏览器行为跟踪（如跟踪分析用户行为等）

### 1.1 组成

Cookie是一段不超过4KB的小型文本数据，主要由以下七个部分组成：

1. Name：cookie的名称
2. Value：cookie的值
3. Path：定义该web站点上可以访问该cookie的目录（或者说路径）
4. Expires：cookie的有效期，有缺省（会话期cookie）和非缺省（持久性cookie）两种状态
5. Domain：服务器域名 
6. Secure：指定是否使用HTTPS安全协议发送Cookie
7. HttpOnly：用于防止客户端脚本通过document.cookie属性访问Cookie

### 1.2 安全策略

Cookie 目前一般用作存储用户的登录信息和登录状态，通常都会设置一个过期时间（如果不设置在浏览器关闭时就会清除该 Cookie），这个时间格式为格林尼治标准时间。但是为了防止信息泄露，这个过期时间一般不会太长，如果用户期间有过再次进入系统，则会更新该过期时间。

> 这一点与后端的 token 过期类似。

Secure 属性和 HttpOnly 属性可以用来确保 Cookie 被正确发送。设置 Secure 属性，可以指定使用 HTTPS 协议来发送加密请求到服务端，因此可以很好的防止"中间人攻击"。而 HttpOnly 属性可以阻止客户端使用 `Document.cookie` 来访问带 HttpOnly 属性的 cookie，该属性可以有效的防止 “XSS 跨站点脚本” 攻击。

> 但是 HttpOnly 无法阻止客户端重新写入新的 cookie（新写入的 cookie 也无法设置 HttpOnly 属性）

Domain 属性和 Path 属性定义了 cookie 的作用域，即 cookie 可以发送给哪些 URL。

Domain 属性指定了可以接受该 cookie（或者说该 cookie 可以发送给哪些）的主机。不指定时默认是 `origin`，并且不包含子域名；如果要指定的话，则一般会包含子域名，例如：设置了 `Domain=mozilla.org`，则 Cookie 也包含在子域名中（如`developer.mozilla.org`）。

Path 属性则定义了主机（服务端）哪些路径可以接受该cookie，并且会包含该路径的所有子路径。

> 目前的所有主流浏览器（除 IE 8 -）之外，都支持了一个新属性 SameSite
>
> `SameSite` Cookie 允许服务器要求某个 cookie 在跨站请求时不会被发送，（其中  [Site](https://developer.mozilla.org/en-US/docs/Glossary/Site) 由可注册域定义），从而可以阻止跨站请求伪造攻击（[CSRF](https://developer.mozilla.org/zh-CN/docs/Glossary/CSRF)）。
>
> SameSite 属性可接收3个值： "None", "Strict" 和 "Lax"。
>
> - `None`：浏览器会在同站请求、跨站请求下继续发送 cookies，不区分大小写。
> - `Strict`：浏览器将只在访问相同站点时发送 cookie。（在原有 Cookies 的限制条件上的加强，如上文 “Cookie 的作用域” 所述）
> - `Lax`：与 **`Strict`** 类似，但用户从外部站点导航至URL时（例如通过链接）除外

### 1.3 漏洞与缺陷

1. **僵尸Cookies**

“僵尸Cookies” 是指Cookie的一种极端使用，这种类型的 Cookie 很难删除，或者说删除后会自动重建，一般是使用 Web Storage API 或者 Flash 本地共享来达到这种目的的，但是这些技术违反了用户隐私和用户控制的原则。

2. **恶意 Cookies**

这类 Cookie 通常是通过在 Cookie 植入特殊的标记语言，比如 "< >"用来指示该段内容是 HTML 代码，这些代码可以定义网页格式，也可以用来执行代码段等等。

这种攻击方式最常见的就是 XSS（跨站脚本）攻击。

3. **Cookie捕获/重放**

指攻击者通过木马等恶意程序，或者跨站脚本等手段窃取用户硬盘或者内存中的Cookies；或者通过在局域网中监听网络通信、攻击中间的网络路由器等将用户的请求欺骗重定向到攻击者的主机等等手段也可以窃取用户 Cookie。

在捕获（窃取）到用户 Cookie 之后，也可以重新发送(重放) 该 Cookie 到服务器，假冒原用户的身份发起攻击。

4. **会话定置**

“会话定置” 则是像受害者主机注入攻击者控制的恶意 Cookies，使受害者以攻击者的身份登录网站窃取会话信息；或者伪造与网站同域的站点来欺骗受害者访问该伪造网站等。

5. **CSRF攻击**

CSRF（Cross-Site Request Forgery， 跨站请求伪造）攻击，是一种挟制用户在当前已登录的Web应用程序上执行非本意的操作的攻击方法，指攻击者通过一些技术手段欺骗用户的浏览器去访问一个自己曾经认证过的网站并运行一些操作（如发邮件，发消息，甚至财产操作如转账和购买商品）。

CSRF攻击并不能直接获取用户账户的控制权和用户的任何信息，而是欺骗浏览器，让浏览器以用户的名义来执行操作或者请求。

6. Cookie 的容量很小（大部分浏览器的限制都是不超过 4KB），并且个数也有限，在发送请求时也会跟随在请求头内一起发送

所以 Cookie 通常不适合用来存储大容量数据，只作为用户信息和登录状态的关键字的保存方式，用来实现客户端与服务器之间通信时的用户认证。

### 1.4 读取和设置

通常 JavaScript 访问和设置 Cookie 都是使用 `document.cookie` 来读取和设置。

直接使用 `document.cookie` 会打印出该站点下所有可访问的 cookie 的 `name=value;` 格式的字符串，并且只有 name 和 value 两个属性。

使用 `document.cookie = "newCookieName=newCookieValue` 的时候则会查找站点下所有 Cookie中是否有和 `newCookieName` 同名的 cookie，有则更新原cookie，没有则新建一个 cookie 。



## 2. Web Storage

Web Storage 最初的目标有两个：一个是提供一个除 Cookie 外新的会话数据存储途径；另一个是提供跨会话持久化存储大容量数据的机制。

Web Storage 分为两类：LocalStorage 和 SessionStorage，09年之后这两个对象都在 window 对象上提供了一个访问地址，可直接使用 `window.localStorage` 或者 `window.sessionStorage` 来访问对应的 Storage。

这两种方式最大的不同在于：LocalStorage 是永久存储机制，SessionStorage 是跨会话的存储机制。

> LocalStorage 和 SessionStorage 都是特定于页面协议的。

### 2.1  LocalStorage

`LocalStorage` 在浏览器上体现为 window 对象的一个只读属性，并且这个属性的值指向浏览器的 `localStorage` 对象，允许脚本访问当前 `Document` 源（同域名同端口，并且不包含子域名）下的 Storage。

`LocalStorage` 主要用于持久化存储数据，其中的数据总是以键值对的形式存储的，并且**所有的键和值都会自动转为字符串形式**。

#### 使用方式

获取当前源下的 `localStorage` 对象可以直接使用一个变量接收：

```javascript
const myLocalStorage = window.localStorage; // 一般情况下 window 可以省略
```

这个对象提供了四个方法，用来增删改查某个键值对和清空本地 `localStorage`。

```javascript
const myLocalStorage = window.localStorage;

myLocalStorage.setItem('newStorage', 'newValue'); // 添加/修改

let newValue = myLocalStorage.getItem('newStorage'); // 读取

myLocalStorage.removeItem('newStorage'); // 移除
 
myLocalStorage.clear(); // 清空
```

### 2.2 SessionStorage

`sessionStorage` 对象主要只用来存储会话数据，只会存储到浏览器关闭。

`sessionStorage` 和 `localStorage` 一样， 浏览器上都体现为 window 对象的一个只读属性，并且这个属性的值指向浏览器的 `sessionStorage` 对象，允许脚本访问当前 `Document` 源（同域名同端口，并且不包含子域名）下的 Storage。

> 注意：
>
> 1.同源的不同标签页不一定会共享 `sessionStorage`，只有通过点击页面内链接，或者使用 `window.open` 打开的新的同源标签页才会和原来的页面共享一个 `sessionStorage`。直接通过地址栏输入地址打开的页面，即使地址一样，但是也是不同的 `sessionStorage`。
>
> 2.在浏览器中刷新页面并不会丢失之前设置的 `sessionStorage`

#### 使用方式

`sessionStorage` 和 `localStorage` 一样，都提供了四个方法用来增删改查和清空本地数据。

```javascript
const mySessionStorage = window.localStorage;

mySessionStorage.setItem('newStorage', 'newValue'); // 添加/修改

let newValue = mySessionStorage.getItem('newStorage'); // 读取

mySessionStorage.removeItem('newStorage'); // 移除
 
mySessionStorage.clear(); // 清空
```

### 2.3 事件

每当 Storage 对象发生变化时（ `sessionStorage` 和 `localStorage` 上的任何更改），都会在文档上触发 storage 事件。

这个事件对应的事件实例对象有4个属性：

1. domain：本地存储对应的域
2. key：被新增/修改/删除的键名
3. newValue：被设置的新值，删除时为null
4. oldValue：变化之前的值

```javascript
window.addEventListener("storage", event => alert('Storage changed for ${event.domain}'));
```



> 需要注意的是，这个事件并不会区分是 `sessionStorage` 还是 `localStorage` 发生的改变。

### 2.4 异同点

由前面的内容可以了解到，`sessionStorage` 和 `localStorage` 最大的区别就是存储时效的不同，当我们在需要做本地数据的持久化时，通常会将数据（例如用户的个性化配置等）保存在 `localStorage` 中。

`localStorage` 和 `sessionStorage` 在存储量上大致相同，上限都是 5MB 左右，具体情况根据浏览器的不同可能略有出入；并且这两者并不会跟随 http 网络请求被发送；在设计时也为用户（开发者）提供了良好易用的 API 和事件。



## 3. IndexedDB

MDN定义：IndexedDB，是一种底层 API，用于在客户端存储大量的结构化数据（也包括文件/二进制大型对象（blobs））。该 API 使用索引实现对数据的高性能搜索。

### 3.1 核心概念

IndexedDB 是一个事务型数据库系统，类似于基于 SQL 的 RDBMS（Relational Database Management System，关系数据库管理系统）。但是 IndexedDB 是基于 JavaScript 的面向对象的数据库，主要用来存储和检索用 **键** 为索引的 **对象**，并且支持二进制数据。

IndexedDB 在设计的时候几乎全是异步结构，所以在操作（调用）IndexedDB 的时候基本上都是以请求的形式执行，并且会返回成功时的结果或者失败时的错误。

IndexedDB 支持事务，意味着在一个完整的操作过程中，只要发生错误，便会退回到该事务发生之前的状态，避免数据的部分改变。

IndexedDB 跟 Web Storage 一样也受同源策略的限制，但是同源下不同标签页会共享存储数据与相关事件（这一点可能会造成并发问题，后面会讲解）。

### 3.2 如何使用

> IndexedDB 是一个比较复杂的 API，涉及不少概念。它把不同的实体，抽象成一个个对象接口。学习这个 API，就是学习它的各种对象接口。
>
> - 数据库：`IDBDatabase` 对象，存储一系列数据的容器对象
> - 对象仓库：`IDBObjectStore` 对象，类似关系数据库的表格
> - 索引： `IDBIndex` 对象
> - 事务： `IDBTransaction` 对象
> - 操作请求：`IDBRequest` 对象
> - 指针： `IDBCursor` 对象
> - 主键集合：`IDBKeyRange` 对象
> - ...
>
>  ---- 摘自 [阮一峰的网络日志: 浏览器数据库 IndexedDB 入门教程](http://www.ruanyifeng.com/blog/2018/07/indexeddb.html)

使用 IndexedDB 的基本模式就是：

1. 打开/创建 数据库
2. 在数据库中创建一个对象仓库
3. 启动一个事务，并发送一个事务请求来执行对应的数据库操作
4. 通过监听对应类型的 DOM 事件来等待或者判断数据库操作的执行结果
5. 根据操作结果进行后续操作

根据以上步骤，可以演示一个基础的 IndexedDB 数据库操作流程。

#### 第一步： 打开/创建数据库

```javascript
const IndexedDB = window.indexedDB;

let db, dbRequest;

dbRequest = indexedDB.open("test", 1);
dbRequest.onerror = event => (alert(`Failed to open: ${event.target.errorCode}`));
dbRequest.onsuccess = event => (db = event.target.result);
```

这里首先是创建一个打开（在不存在 `test` 这个数据库的时候则是创建）数据库的 `IDBRequest` 请求实例，并在这个实例上添加 `onerror` 和 `onsuccess` 事件处理的回调函数，来处理请求失败或者成功时的事件（几乎所有的请求都需要处理这两个事件的回调函数）。

`open(dbName: String, version: Number = 1)` 可以接受第二个**正整数**参数 `version`，用来指定对应数据库的版本，如果已经存在了这个数据库的话，则会将该数据库进行升级（第二步会对升级造成的影响进行说明）。

#### 第二步： 创建数据仓库

在第一步的 `open` 操作中，会创建一个新的数据库（或者读取原有的仓库，后面为了简洁，都会省略获取部分，除非有特殊说明），并且在创建完成后，会触发一个 `upgradeneeded` 事件。 `open` 操作返回的请求实例 `dbRequest` 中也会有一个 `upgradeneeded` 属性。我们可以通过设置该属性为一个回调函数，在回调中创建需要的数据仓库。

```javascript
dbRequest.onupgradeneeded = function(event) {
    // 保存 IDBDataBase 接口
    let db = event.target.result;

    // 首先利用 contains 判断是否已经存在 person 仓库
	if (!db.objectStoreNames.contains('person')) {
        // 为该数据库创建一个对象仓库
        let objectStore = db.createObjectStore("person", { keyPath: "myKey" });
    }
};
```

这一步完成之后，我们就在这个数据库中创建了一个名字叫 `person` 的数据仓库，类似关系数据库中的一个数据表。

> `createObjectStore(storeName: String, options: Object)` 方法接收两个参数，第一个是仓库名，第二个是键的配置项，可配置的有两个属性： `keyPath` 和 `autoIncrement`。
>
> `keyPath` 属性可设置一个字符串值，表示该数据仓库下的每条数据使用哪一个字段来作为键。
>
> `autoIncrement` 属性可设置一个布尔值，表示是否开启键生成器；开启时默认从1开始，新数据会在之前的键的基础上加1作为新的键，且不会减小。
>
> 这两个属性一般只设置一个，生成或者选取的键类似于关系表中的“主键”，或者说“索引”

#### 第三、四、五步：创建事务进行数据库操作并根据返回结果进行后续操作

在数据库和数据仓库都创建完成之后，剩下的所有操作几乎都需要用**事务**来完成。每一个系列操作，都会对应一个事务实例。

实例化是一个事务使用 `db.transaction()` 方法：

```typescript
// 为了说明实例化方法需要的参数，这里用 TS 来举例
let myTransaction: IDBTransacation = db.transaction(storeNames: string[], mode?: "readonly" | "readwrite" | "versionchange", options?: { error(): void });
```

> mode 参数的不同值对应不同的操作权限，具体内容请查看 [MDN  IDBTransaction](https://developer.mozilla.org/zh-CN/docs/Web/API/IDBTransaction)， [MDN IndexedDB 增加、读取和删除数据](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API/Using_IndexedDB#%E5%A2%9E%E5%8A%A0%E3%80%81%E8%AF%BB%E5%8F%96%E5%92%8C%E5%88%A0%E9%99%A4%E6%95%B0%E6%8D%AE)

因为事务本身也是一个请求，所以也需要配置对应的事件处理函数 `onseccess` 和 `onerror`，除了这两个事件外事务还有另外一个事件处理函数 `oncomplete`，这个函数通常用来代替 `onsuccess` 用来处理事务请求成功之后的事件（某些事务无法通过 `oncomplete` 事件返回的 `event` 对象来访问数据时，则还是只能用 `onsuccess`）。

可以使用 `add()` 和 `put()` 方法添加和更新对象，使用 `get()` 取得对象，使用 `delete()` 删除对象，使用 `clear()` 删除所有对象。其中，`get()` 和 `delete()` 方法都接收对象键作为参数，这 5 个方法都创建新的请求对象。

下面是通过事务来进行增删改查操作的例子：

```javascript
const transaction = db.transaction(['person'], "readwrite");
const objectStore = transaction.objectStore('person');

const errorFunction = () => console.log('事务处理失败');

// 读取
const read = function() {
    const readRequest = objectStore.get(1);
    readRequest.onerror = errorFunction;
    readRequest.onsuccess = function(event) {
        if (request.result) {
            console.log('Name: ' + request.result.name);
            console.log('Age: ' + request.result.age);
        } else {
            console.log('未获得数据记录');
        }
    };
}

// 增加
const add = function() {
    const addRequest = objectStore.add({ id: 1, name: '张三', age: 24 });
    addRequest.onerror = errorFunction;
    addRequest.onsuccess = function(event) {
        if (request.result) {
            console.log('数据写入成功');
        } else {
            console.log('数据写入失败');
        }
    };
}

// 修改
const update = function() {
    const updateRequest = objectStore.put({ id: 1, name: '张三', age: 24 });
    updateRequest.onerror = errorFunction;
    updateRequest.onsuccess = function(event) {
        if (request.result) {
            console.log('数据修改成功');
        } else {
            console.log('数据修改失败');
        }
    };
}

// 删除
const delete = function() {
    const deleteRequest = objectStore.delete(1);
    deleteRequest.onerror = errorFunction;
    deleteRequest.onsuccess = function(event) {
        if (request.result) {
            console.log('数据删除成功');
        } else {
            console.log('数据删除失败');
        }
    };
}

// 遍历
const traverse = function() {
    const traverseRequest = objectStore.openCursor();
    traverseRequest.onerror = errorFunction;
    traverseRequest.onsuccess = function(event) {
        console.log('遍历结束');
    };
}

// 清空
const clear = function() {
    const clearRequest = objectStore.clear();
    clearRequest.onerror = errorFunction;
    clearRequest.onsuccess = function(event) {
        console.log('清空成功');
    };
}
```

