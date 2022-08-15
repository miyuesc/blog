# TypeScript 类型梳理

**TypeScript** 是由 [ 微软 ] 进行开发和维护的一种 [ 开源 ] 的 [ 编程语言 ]，TypeScript是 JavaScript **类型的超集**，它可以编译成纯JavaScript。并且 TypeScript 可以在任何浏览器、任何计算机和任何操作系统上运行。

## 1. 基础类型

与 JavaScript 的基础数据类型一样，TypeScript 也提供了基础的类型单元。

### 1.1 布尔 Boolean

布尔值就是只有 **true/false** 的值

```typescript
let isBol: boolean = true
isBol = false
isBol = '' // error: TS2322: Type 'string' is not assignable to type 'boolean'.
```

### 1.2 数字 Number

与 JavaScript 一样，TypeScript 里面一样也只有浮点数；默认支持 十进制、十六进制、二进制、八进制

```typescript
let decLiteral: number = 6;
let hexLiteral: number = 0xf00d;
let binaryLiteral: number = 0b1010;
let octalLiteral: number = 0o744;
```

### 1.3 字符串 String

字符串可以用 双引号 `" "` 、单引号 `' '` 或者模板字符串 ' \` ' 表示，也可以用  ` +` 串联

```typescript
let name: string = `Gene`;
let age: number = 37;
let sentence: string = `Hello, my name is ${ name }.
I'll be ${ age + 1 } years old next month.`;
```

### 1.4 数组 Array

这里的数组一般用来表示 **同种数据格式的数据** 组成的数组，可以用两种方式声明

```typescript
let list: number[] = [1, 2, 3];
let users: Array<User> = [{name: 'xxx', age: 18}]; // User 类型需要提前声明
```

### 1.5 元组 Tuple

一般用来表示 **已知长度和元素类型的数组**，这里的元素类型可以分别设置。

```typescript
type Address = {
  country: string
  add?: string
  province?: string
}
let userAttrs: [string, number, boolean, Address] = ['MiyueFE', 27, true, { country: 'China' }]
```

> 元组数据可以直接通过下标访问，如果下标 **超过元组定义的长度范围**，则此处的类型配置默认为 **已定义的元素类型的“并集”（联合类型）**

### 1.6 枚举 Enum

枚举类型是对JavaScript标准数据类型的一个补充。 类似一个键值对组成但是key和value能互相引用的对象。

```typescript
enum Color {Red = 1, Green, Blue}
let c: Color = Color.Green;
```

> 枚举类型定义的编号默认是从0开始的自增整数，并且可以通过编号查找到对应的类型

### 1.7 Undefined 和 Null

这两者在 TypeScript 中的定义与 JavaScript 基本一致，各自的类型也就是本身。

```typescript
let u: undefined = undefined;
let n: null = null;
```

> 在没有开启严格类型校验 **--strictNullChecks** 时，这两个类型可以是所有类型的子类型；但是开启严格类型校验之后，这两者就只能赋值给 **void** 和他们自身的两个类型

### 1.8 未知类型 unknown

unknown 是 3.0 新增的类型，作用与 any 相似，但是使用比 any 更加严格。

> **unknown 类型的值可以等于任意类型的数据值，但是不能将 unknown 类型的值赋值在其他类型**

```
let value: unknown;

value = true;             // OK
value = 42;               // OK
value = [];               // OK
value = {};               // OK
value = Math.random;      // OK
value = null;             // OK
value = undefined;        // OK

let value1: unknown = value;   // OK
let value2: any = value;       // OK
let value3: boolean = value;   // Error
let value4: number = value;    // Error
```

### 1.9 空值 void

void 语义上表示没有任何值，一般用来表示函数没有返回值（即返回值为 undefined）

```typescript
function fc(): void {
}
```

### 1.10 任意类型 any

any 一般用来 **关闭** 类型检查器对该变量的 **类型检查**，当一个变量的类型设置为 any 之后，对该变量进行的任何操作都不会引起编译器的任何检查，只有当运行到此处时根据 JavaScript 规则正常通过或者报错。

```typescript
let list: any[] = [1, true, "free"];
list[1] = 100;
list.substring(1) // 执行时报错：Uncaught TypeError: list.substring is not a function
```

### 1.11 永不到达 never

`never` 类型表示的是那些永不存在的值的类型。比如 抛出异常、死循环、没有返回值的箭头函数等。

```typescript
// 返回never的函数必须存在无法达到的终点
function error(message: string): never {
  throw new Error(message);
}

// 推断的返回值类型为never
function fail() {
  return error("Something failed");
}

// 返回never的函数必须存在无法达到的终点
function infiniteLoop(): never {
  while (true) {
  }
}
```

> never 的使用与 unknown 有点类似，它是所有类型的子类型，可以 **赋值给任何类型**，但是 never 类型的变量 **只接受 never 类型数据**，其他类型（包括 any）均不可以赋值给 never 类型

### 1.12 泛型

个人理解，泛型是一种 **定义时为 unknown，但使用时需要指定类型** 的类型，定义时使用 **一对尖括号加一个字符/字符串变量（通常为全大写）**表示。

```typescript
function fc<T>(value: T): T {
  console.log(value)
  return value
}
```

## 2. 高级类型

### 2.1 交叉类型 `&`

相当于 **类型合并**，将多个类型合并为一个类型。

```typescript
type UserBase = {
  name: string
  age: number
  sex: number
}
type UserAddress = {
  name: string
  country: string
  addr?: string
  province?: string
}
type UserInfo = UserBase & UserAddress
// 结果如下：
type UserInfo = {
  name: string
  age: number
  sex: number
  country: string
  addr?: string
  province?: string
}
```

> 如果合并的两个类型 **有相同项**，且 **相同项的类型不同**，则合并后的该项会被定义为 never 类型

### 2.2 联合类型 `|`

联合类型表示该数据的类型可以是定义的几种类型 **之一**。

```typescript
type UserBase = {
  name: string
  age: number
  sex: number
}
type UserAddress = {
  name: number
  country: string
  addr?: string
  province?: string
}
type UserInfo = UserBase | UserAddress
```

> 假设这个时候 UserInfo 在使用时如果定义的数据是 **UserBase**，则 **name** 属性只能是 **string** 类型，整个数据类型为 **UserBase**。

## 3. 推断类型

官方说法 **Utility Types**，也叫实用类型。个人理解是内部提供的一种原类型的处理方式，所以称为推断类型。

### 3.1 可选属性处理 `Partial<T>`

将某个类型的所有属性 **全部设置为可选属性**

```typescript
type Type = {
  id: number;
  firstName: string;
  lastName: string;
}

type PartialType = Partial<Type>
/*
等效于
type PartialType = {
  id?: number
  firstName?: string
  lastName?: string
}
*/
```

### 3.2 必选属性处理 `Required<T>`

正好与 **Partial** 相反，将某个类型的所有属性 **全部设置为必填**

```typescript
type Type = {
  id: number;
  firstName?: string;
  lastName?: string;
}

type RequiredType = Required<Type>
/*
等效于
type RequiredType = {
  id: number
  firstName: string
  lastName: string
}
*/
```

### 3.3 只读属性处理 `Readonly<T>`

将某个类型的所有属性 **全部设置为只读**

```typescript
type Type = {
  id: number;
  firstName: string;
  lastName: string;
}

type ReadonlyType = Readonly<Type>
/*
等效于
type ReadonlyType = {
  readonly id: number
  readonly firstName: string
  readonly lastName: string
}
*/
```

### 3.4 属性选择重建 `Pick<T, K>`

只将某个类型的 **部分属性提取出来**，组成一个全新的类型

- `T`代表要抽取的对象
- `K`有一个约束: 一定是来自`T`所有属性字面量的联合类型

```typescript
type Type = {
  id: number;
  age: number;
  firstName: string;
  lastName: string;
}
type PickType = Pick<Type, 'firstName' | 'lastName'>
/*
等效于
type PickType = {
  firstName: string
  lastName: string
}
*/
```

### 3.5 剩余属性重建 `Omit<T, K>`

与 **Pick** 相反，指排 **除掉指定部分，将剩余属性组合** 成一个全新的类型

```typescript
type Type = {
  id: number;
  age: number;
  firstName: string;
  lastName: string;
}
type OmitType = Omit<Type, 'id' | 'age'>
/*
等效于
type OmitType = {
  firstName: string
  lastName: string
}
*/
```

###  3.6 同名属性提取 `Extract<T, U>`

从 T 中提取出可以在 U 中查找的属性，实现为 **type Extract<T, U> = T extends U ? T : never**

> 这种情况一般用于提取两个类型的相同属性名组合成一个联合字符类型。

```typescript
interface FirstType {
  id: number;
	sex: number;
  firstName: string;
  lastName: string;
}

interface SecondType {
  id: number;
	sex: number;
  address: string;
  city: string;
}

type ExtractType = Extract<keyof FirstType, keyof SecondType>;

/*
等效于
type ExtractType = 'id' | 'sex'
*/
```

### 3.7 非同名属性提取 `Exclude<T, U>`

与 **Extract<T, U>** 相反（注：**此时仅提取 T 中的属性判断**）。

```typescript
interface FirstType {
  id: number;
	sex: number;
  firstName: string;
  lastName: string;
}

interface SecondType {
  id: number;
	sex: number;
  address: string;
  city: string;
}

type ExcludeType = Exclude<keyof FirstType, keyof SecondType>;

/*
等效于
type ExcludeType = 'firstName' | 'lastName'
*/
```

### 3.8 属性类型生成 `Record<T, U>`

按照 T 作为 key 的类型、U 作为 value 的类型定义一组键值对对象，一般 T 是字符串或者数字，U 可以为任何类型

```typescript
type RecordType = Record<string | number，User[] | User | string | number | boolean>

const recordData = {
  1: 1,
  2: '2',
  user: { username: 'xxx' },
  delete: false
}
```

### 3.9 非空类型生成 `NonNullable<T>`

从 T 中排除 null 和 undefined

```typescript
type DefaultType = string | number | null | undefined;

type NonNullableType = NonNullable<DefaultType>
/*
等效于
type NonNullableType = string | number
*/
```

### 3.10 映射类型

从一个类型中提取所有属性名来组成一个新类型

> 前面的部分类型就是映射类型处理的。

```typescript
type Type = {
  id: number;
  age: number;
  firstName: string;
  lastName: string;
}

type MappedType = {
  [T in keyof Type]: Type[T] | boolean
}
/*
等效于
type MappedType = {
  id: number | boolean;
  age: number | boolean;
  firstName: string | boolean;
  lastName: string | boolean;
}
*/
```

