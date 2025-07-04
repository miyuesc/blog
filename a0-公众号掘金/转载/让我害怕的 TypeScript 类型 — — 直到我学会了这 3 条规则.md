# 让我害怕的 TypeScript 类型 — — 直到我学会了这 3 条规则

>原文：[《TypeScript Types That Scared Me — Until I Learned These 3 Rules》](https://medium.com/the-syntax-diaries/typescript-types-that-scared-me-until-i-learned-these-3-rules-34f8ea09ecb2)
>
>作者：[Amaresh Adak](https://medium.com/@amareshadak)

当我第一次看到 TypeScript 的 `infer` 和条件类型时，我反手就关了浏览器标签页，心里默念：“这辈子别再让我看见你们！”。它们看起来就像黑魔法——一堆抽象的符号和尖括号扭曲在一起，感觉就是为了搞我心态而设计的。

像 `T extends (infer U)[] ? U : never` 或者 `DistributiveConditional<T>` 这种类型，一度让我怀疑人生，甚至开始琢磨要不要转行。但！是！朋友们，重点来了：**这些玩意儿根本不是什么高深莫测的概念，只是披着吓人语法外衣的纸老虎罢了。**

只要你掌握了三个简单的思维模型，它们就一点也不可怕了。在这篇文章里，我就带你走一遍那些让我豁然开朗的核心概念——保证全是实战干货，不玩虚的。

### 别怕，你不是一个人在战斗

### 这种恐惧，我们都懂

我得先说清楚：如果你曾被 TypeScript 的高级类型吓到过，恭喜你，你找到了组织。别说你了，就连经验丰富的老鸟，第一次碰到条件类型和 `infer` 关键字时，也得懵圈一会儿。

我至今还记得，当初我盯着下面这行代码，感觉自己像个迷失在代码森林里的小白兔：

```typescript
Copytype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

`infer R` 到底是个什么鬼？为啥这么多问号和冒号？这代码看起来就像是某人脸滚键盘一通乱敲，然后就提交了。

但说真的，我多希望当时有人能告诉我：**这些高级类型其实都有套路可循**。一旦你理解了底层的思维模型，你就会发现它们无处不在——更重要的是，你将学会如何在合适的时机、用正确的方式驾驭它们。

### 规则一：条件类型，就是类型世界的 if...else

*“搞得定 if...else，就搞得定条件类型。”*

这是我的第一个顿悟。TypeScript 里的条件类型，工作原理跟 JavaScript 里的条件语句一毛一样，只不过它是在“类型”层面做判断，而不是在“值”层面。

**基本模式简单粗暴：**

```typescript
Copytype MyType<T> = T extends SomeCondition ? TrueResult : FalseResult;
```

咱们从一个简单的例子入手：

```typescript
Copytype IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<123>;     // false
type C = IsString<boolean>; // false
```

看到了吗？这不就是个给类型用的 if 语句嘛。当 `extends` 左边的类型能赋值给右边的类型时，你就得到第一个分支（“true”分支）的类型；否则，就得到第二个分支（“false”分支）的类型。

**接下来，上点实用的。** 假设你在写一个组件，它的行为需要根据传入的 props 动态改变：

```typescript
Copytype ButtonProps<T extends boolean> = {
  loading: T;
} & (T extends true 
  ? { onClick?: never; disabled: true } 
  : { onClick: () => void; disabled?: boolean }
);

// 当 loading 是 true 时，onClick 属性就得“滚蛋”，而且 disabled 必须为 true
const loadingButton: ButtonProps<true> = {
  loading: true,
  disabled: true,
  // onClick: () => {} // ❌ 类型错误！loading 的时候不准点！
};

// 当 loading 是 false 时，onClick 就是必须的了
const normalButton: ButtonProps<false> = {
  loading: false,
  onClick: () => console.log('点我呀!'),
  disabled: false
};
```

**思维模型就是：** 你可以把条件类型想象成 TypeScript 在说：“嘿，如果这个类型长得像那个，那就给我这个类型；不然的话，就给我另一个。”

### 规则二：裸类型参数的“分发”魔术

*“你给它一个联合类型，TypeScript 就会自动帮你‘遍历’——除非你喊停。”*

这个规则我花了更长时间才搞明白，但一旦顿悟，那感觉，简直不要太爽。

当条件类型作用于一个泛型时，如果你给这个泛型传入一个联合类型，它就会变得具有“分发性”。这意味着 TypeScript 会自动地、分别地将条件类型应用到联合类型的每一个成员上。

**关键点来了：** 这种“分发”行为只在泛型参数是“裸类型”的时候发生。

```sql
Copy// 这就是“裸类型”—— T 直接出现在 extends 子句里
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<'a' | 'b' | 'c'>;
// 结果是： 'a'[] | 'b'[] | 'c'[]
// 而不是： ('a' | 'b' | 'c')[]
```

**为啥会这样呢？** TypeScript 把联合类型 `'a' | 'b' | 'c'` 给“拆开”了，然后逐一处理：

- `'a' extends any ? 'a'[] : never` → `'a'[]`
- `'b' extends any ? 'b'[] : never` → `'b'[]`
- `'c' extends any ? 'c'[] : never` → `'c'[]`

最后，它把所有结果再用联合类型组合起来：`'a'[] | 'b'[] | 'c'[]`

**但是，如果你不想要这种自动分发，也有办法关掉它：**

```typescript
Copy// 用方括号把 T 包起来，让它不再“裸奔”
type NoDistribute<T> = [T] extends [any] ? T[] : never;

type Result2 = NoDistribute<'a' | 'b' | 'c'>;
// 结果就变成了： ('a' | 'b' | 'c')[]
```

**来个实战例子：** 从联合类型中过滤掉某些类型。

```typescript
Copytype NonNullable<T> = T extends null | undefined ? never : T;

type Clean = NonNullable<string | null | number | undefined>;
// Clean 的结果是： string | number
// null 和 undefined 被自动过滤掉了，干净！
```

这种分发特性可以用来过滤联合类型，这正是 TypeScript 内置的 `Exclude` 工具类型的工作原理。

### 规则三：用 `infer` 偷窥类型内部

*“你可以像用模式匹配一样，从其他类型中提取类型。”*

`infer` 关键字是我 TypeScript 学习之路上的终极 BOSS。但一旦我征服了它，整个世界都清晰了。

**你可以把 `infer` 想象成这样一句话：** “嘿，TypeScript，我现在还不知道这个类型具体是啥，但等会儿你推断出来了，就把它存到这个叫 R 的变量里，我好用它。”

条件类型为我们提供了一种在 `true` 分支中，使用 `infer` 关键字从我们比较的类型中推断出新类型的方法。

下面是经典案例：

```typescript
Copytype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getName(): string { return "John"; }
function getAge(): number { return 25; }

type NameType = ReturnType<typeof getName>; // string
type AgeType = ReturnType<typeof getAge>;   // number
```

**这里发生了什么？**

1.  我们检查 `T` 是不是长得像一个函数 `(...args: any[]) => something`
2.  如果像，我们就说：“不管那个 ‘something’ 是啥，都把它命名为 `R`”
3.  然后我们返回 `R`
4.  如果 `T` 长得不像函数，就返回 `never`

**我们来构建一个更实用的东西** —— 提取数组成员的类型：

```typescript
Copytype ArrayElement<T> = T extends (infer U)[] ? U : never;

type StringArray = string[];
type NumberArray = number[];

type StringType = ArrayElement<StringArray>; // string
type NumberType = ArrayElement<NumberArray>; // number
type NotArray = ArrayElement<boolean>; // never
```

**接下来是见证奇迹的时刻** —— 提取组件的 props 类型：

```typescript
Copytype PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;

const MyButton: React.FC<{ label: string; onClick: () => void }> = (props) => (
  <button onClick={props.onClick}>{props.label}</button>
);

type MyButtonProps = PropsOf<typeof MyButton>;
// MyButtonProps is: { label: string; onClick: () => void }
```

**多个 `infer` 声明** 也能一起用：

```typescript
Copytype FunctionInfo<T> = T extends (first: infer A, second: infer B) => infer R 
  ? { args: [A, B]; return: R } 
  : never;

type LoginFunction = (username: string, password: string) => Promise<boolean>;

type LoginInfo = FunctionInfo<LoginFunction>;
// LoginInfo is: { args: [string, string]; return: Promise<boolean> }
```

### 彩蛋规则：映射类型，从小处着手就不难

既然你已经搞懂了条件类型和 `infer`，那么映射类型对你来说就是小菜一碟了。

**映射类型可以转换现有类型。** 你可以把它想象成一个专门给类型属性用的 `for...in` 循环。

```typescript
Copytype Optional<T> = {
  [K in keyof T]?: T[K];
}
```

**说人话就是：** “对于类型 `T` 中的每一个属性 `K`，都创建一个同名的新属性，但让它是可选的，并且类型保持为 `T[K]` 不变。”

```typescript
Copytype User = {
  id: number;
  name: string;
  email: string;
};

type PartialUser = Optional<User>;
// PartialUser is: {
//   id?: number;
//   name?: string;
//   email?: string;
// }
```

**我们来整点更有意思的** —— 把所有属性的类型都变成字符串：

```typescript
Copytype Stringify<T> = {
  [K in keyof T]: string;
}


type StringifiedUser = Stringify<User>;
// StringifiedUser is: {
//   id: string;
//   name: string;
//   email: string;
// }
```

**映射类型与条件类型的梦幻联动：**

```typescript
Copytype NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

class UserService {
  id: number = 1;
  name: string = "John";
  save(): void {}
  delete(): void {}
}

type UserData = NonFunctionProperties<UserService>;
// UserData is: { id: number; name: string }
// Methods are filtered out!
```

### 终极合体：一个真实世界的例子

让我们来构建一个类型，它可以从 Redux 的 action 中提取出 payload 的类型：

```typescript
Copy// 我们的 action 类型们
type LoginAction = { type: 'LOGIN'; payload: { username: string; password: string } };
type LogoutAction = { type: 'LOGOUT'; payload: null };
type UpdateProfileAction = { type: 'UPDATE_PROFILE'; payload: { name: string; email: string } };

type Actions = LoginAction | LogoutAction | UpdateProfileAction;

// 为特定的 action 提取 payload 类型
type PayloadOf<T, ActionType extends string> = T extends { type: ActionType; payload: infer P } 
  ? P 
  : never;

// 用法
type LoginPayload = PayloadOf<Actions, 'LOGIN'>;
// LoginPayload 的类型是： { username: string; password: string }

type LogoutPayload = PayloadOf<Actions, 'LOGOUT'>;
// LogoutPayload 的类型是： null

type UpdatePayload = PayloadOf<Actions, 'UPDATE_PROFILE'>;
// UpdatePayload 的类型是： { name: string; email: string }
```

**发生了什么：**

1.  我们利用条件类型的分发特性来检查联合类型中的每一个 action
2.  当 action 类型匹配时，我们用 `infer` 来提取 payload 的类型
3.  然后，TypeScript 就精准地把我们需要的 payload 类型交到我们手上了！

### 你的下一步修炼计划

既然你已经掌握了这三大法则，你就会开始在 TypeScript 内置的工具类型中，处处发现它们的影子：

- `Pick<T, K>` uses mapped types
- `Exclude<T, U>` uses distributive conditional types
- `ReturnType<T>` uses `infer`
- `Parameters<T>` combines conditional types with `infer`

**我给你下一个战书：** 打开 TypeScript 的内置工具类型（在你编辑器的类型定义里就能找到），然后用我们今天学的这三条规则，去搞懂它们的工作原理。

从 `Partial<T>`、`Required<T>` 和 `ReturnType<T>` 开始。等这些都搞明白了，再向 `Extract<T, U>` 和 `NonNullable<T>` 进发。

### 总结一下

TypeScript 的高级类型不是什么黑魔法，它们就是三个简单的概念：


1.  **条件类型** = 给类型用的 if-else
2.  **分发行为** = 自动遍历联合类型
3.  **infer** = 用模式匹配来提取类型

一旦你把这些模式内化于心，你就再也不会被复杂的类型定义吓到了。相反，你会开始发现各种机会，用它们来让你的代码变得更类型安全、更具表现力。

掌握高级类型不仅仅是为了在同事面前秀一把——它将**彻底改变你建模和重构代码的方式**。你能在编译时就捕获到那些可能需要花数小时在生产环境中调试的 bug。

**准备好提升你的 TypeScript 功力了吗？** 先从你常用的一个工具类型开始，搞懂它的底层原理，然后从零开始自己实现一个。

相信我，一旦你能流畅地读写这些类型，你会纳闷自己以前没它们是怎么活过来的。

*你正在挑战哪个 TypeScript 类型难题？在评论区留言，我们一起解决它！如果这篇文章帮你揭开了高级类型的神秘面纱，请给它点个赞，并分享给那些还在类型地狱里挣扎的开发者伙伴们吧。*