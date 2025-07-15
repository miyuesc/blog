# 为什么 JavaScript 的 Map 比 Object 更好

> 原文： [《Why Is JavaScript’s Map Better Than Object?》](https://medium.com/@hxu0407/why-is-javascripts-map-better-than-object-4a7fc25a25ea)
>
> 作者：[Hui](https://medium.com/@hxu0407)

 JavaScript 提供了 Map 和 Object 来存储键值对，但是 Map 在许多场景下具有显著的优势。

## 1. Key 类型的灵活性

### 1.1 键的范围

#### Object:

对象键 **只能是字符串或符号**。其他类型（例如对象、函数和数字）会 **自动转换为字符串**：

```javascript
const obj = {};
const key = { id: 1 };
obj[key] = 'value'; // Key is converted to "[object Object]"
console.log(obj);    // { "[object Object]": "value" }
```

#### Map:

Map 的键可以是 **任何类型**，包括对象、函数和 NaN：

```javascript
Copyconst map = new Map();
const key = { id: 1 };
map.set(key, 'value');  // Key retains its original type
console.log(map.get(key)); // "value"
```

### 1.2 处理特殊键

使用 NaN 作为键：

```javascript
Copyconst map = new Map();
map.set(NaN, 'Not a Number');
console.log(map.get(NaN)); // "Not a Number"
const obj = {};
obj[NaN] = 'Not a Number';
console.log(obj[NaN]); // "Not a Number", but internally converted to the string "NaN"
```


Map 可以正确识别 `NaN` 作为唯一键，而 Object 会将其转换为字符串。

## 2. 内置方法和性能

### 2.1 内置方法

Map 提供了更直观的 API：

```javascript
Copymap.set(key, value);  // Add a key-value pair
map.get(key);         // Retrieve a value
map.has(key);         // Check if a key exists
map.delete(key);      // Remove a key-value pair
map.clear();          // Remove all entries
map.size;             // Get the number of entries (no need for Object.keys(obj).length)
```


相比之下，Object 需要手动处理：

```javascript
Copyobj[key] = value;      // Add a property
obj[key];              // Retrieve a value
delete obj[key];       // Remove a property
Object.keys(obj).length; // Get the number of properties
```

### 2.2 迭代效率

Map 支持直接迭代：

```javascript
Copymap.forEach((value, key) => { /* ... */ });
for (const [key, value] of map) { /* ... */ }
```


相反，Object 在迭代之前需要进行转换：

```javascript
CopyObject.keys(obj).forEach(key => { /* ... */ });
Object.values(obj).forEach(value => { /* ... */ });
Object.entries(obj).forEach(([key, value]) => { /* ... */ });
```



### 2.3 性能比较

- 频繁的增删改查操作：Map 针对频繁的键值插入和删除操作做了优化。
- 处理大型数据集：Map 通常在内存使用和访问速度方面表现更好，尤其是动态生成的键。



## 3. 保留插入顺序


Map 严格维护键值对的插入顺序，非常适合顺序很重要的场景：

```javascript
Copyconst map = new Map();
map.set('a', 1);
map.set('b', 2);
console.log([...map]); // [['a', 1], ['b', 2]]
```


对于对象，ES6+ 保证以下顺序：

- 数字键按升序排序。
- 字符串键维持插入顺序。
- 符号键保持插入顺序。


但是，依赖对象键顺序可能会导致兼容性问题，尤其是在较旧的 JavaScript 引擎中。

## 4. 避免原型污染

### 对象容易受到原型链污染：

```javascript
Copyconst obj = {};
console.log(obj.constructor); // Outputs Object constructor
obj.hasOwnProperty('key');    // Can be overridden
```

### Map 独立于原型链：

```javascript
Copyconst map = new Map();
console.log(map.constructor); // Outputs Map constructor
map.set('hasOwnProperty', 'safe'); // Safe to use
```

## 5. 推荐使用场景



| 场景                               | 推荐的数据结构 | 原因                         |
| ---------------------------------- | -------------- | ---------------------------- |
| 复杂键类型(对象、函数)             | Map            | 支持任何键类型               |
| 频繁的键值插入和删除               | Map            | Map 性能更强                 |
| 保持插入顺序                       | Map            | 保证插入顺序                 |
| 快速键值计数和检索                 | Map            | 插入键值对数量和大小计算更快 |
| 避免原型污染                       | Map            | 不受原型链的干扰             |
| 只需要基础字符串键名的简单静态数据 | Object         | 语法简洁                     |
| 对象需要 JSON 序列化               | Object         | Map 不能直接序列化           |



## 6. 代码示例



### 6.1 词频统计



使用Map: 

```javascript
Copyconst text = "apple banana apple orange";
const wordCount = new Map();
text.split(' ').forEach(word => {
  wordCount.set(word, (wordCount.get(word) || 0) + 1);
});
console.log(wordCount.get('apple')); // 2
```



使用 Object:

```javascript
Copyconst text = "apple banana apple orange";
const wordCount = {};
text.split(' ').forEach(word => {
  wordCount[word] = (wordCount[word] || 0) + 1;
});
console.log(wordCount.apple); // 2
```



### 6.2 使用对象作为键

使用 Map 的正确实现：

```javascript
Copyconst user1 = { id: 1 };
const user2 = { id: 2 };
const permissions = new Map();
permissions.set(user1, ['read']);
permissions.set(user2, ['write']);
console.log(permissions.get(user1)); // ['read']
```



使用 Object 会失败：

```javascript
Copyconst user1 = { id: 1 };
const user2 = { id: 2 };
const permissions = {};
permissions[user1] = ['read'];  // Key converted to "[object Object]"
permissions[user2] = ['write']; // Overwrites previous key
console.log(permissions[user1]); // ['write']
```



## 7. 结论

在以下情况下使用 Map：

- 使用动态或复杂的键类型
- 执行频繁插入或删除
- 保留插入顺序
- 快速检索已插入条目数量
- 避免原型链干扰

在以下情况下使用对象：

- 存储简单、静态的数据
- 需要 JSON 序列化
- 更喜欢使用更简洁的语法来定义键值对


在现代 JavaScript 开发中选择正确的数据结构可以显著提高代码的可维护性和性能。









