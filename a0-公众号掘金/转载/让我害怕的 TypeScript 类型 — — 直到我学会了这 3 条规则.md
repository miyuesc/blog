# 让我害怕的 TypeScript 类型 — — 直到我学会了这 3 条规则

>原文：[《TypeScript Types That Scared Me — Until I Learned These 3 Rules》](https://medium.com/the-syntax-diaries/typescript-types-that-scared-me-until-i-learned-these-3-rules-34f8ea09ecb2)
>
>作者：[Amaresh Adak](https://medium.com/@amareshadak)

When I first encountered TypeScript's `infer` and conditional types, I closed the tab and hoped I'd never see them again. They looked like dark magic — abstract symbols twisted around angle brackets that seemed designed to make my brain hurt.

Types like `T extends (infer U)[] ? U : never` or `DistributiveConditional<T>` made me question my entire career choice. But here's the thing that changed everything: **these aren't actually complicated concepts dressed up in scary syntax.**

Once I understood three simple mental models, they stopped being scary. In this post, I'll walk you through the exact concepts that finally made these types click for me — with real-world examples, not theory.

### The Fear Is Real — 

### And It's Not Just You

Let me be clear: if you've felt intimidated by TypeScript's advanced types, you're in good company. Even experienced developers struggle with conditional types and the `infer` keyword when they first encounter them.

I remember staring at code like this and feeling completely lost:

```typescript
Copytype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

What the hell was `infer R` supposed to mean? Why all the question marks and colons? It looked like someone had thrown punctuation at a keyboard and called it a day.

But here's what I wish someone had told me earlier: **these advanced types follow predictable patterns**. Once you understand the underlying mental models, you'll see them everywhere — and more importantly, you'll know when and how to use them.

### Rule #1: Conditional Types Mirror Control Flow

*"If you understand if…else, you can understand conditional types."*

This was my first breakthrough. Conditional types in TypeScript work exactly like conditional statements in JavaScript, just at the type level instead of the value level.

**The basic pattern is simple:**

```typescript
Copytype MyType<T> = T extends SomeCondition ? TrueResult : FalseResult;
```

Let's start with something straightforward:

```typescript
Copytype IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<123>;     // false
type C = IsString<boolean>; // false
```

See? It's just an if-statement for types. When the type on the left of `extends` is assignable to the one on the right, you get the type in the first branch (the "true" branch); otherwise you get the type in the latter branch (the "false" branch).

**Here's where it gets practical.** Let's say you're building a component that should behave differently based on its props:

```typescript
Copytype ButtonProps<T extends boolean> = {
  loading: T;
} & (T extends true 
  ? { onClick?: never; disabled: true } 
  : { onClick: () => void; disabled?: boolean }
);

// When loading is true, onClick is forbidden and disabled is required
const loadingButton: ButtonProps<true> = {
  loading: true,
  disabled: true,
  // onClick: () => {} // ❌ Type error! Can't have onClick when loading
};

// When loading is false, onClick is required
const normalButton: ButtonProps<false> = {
  loading: false,
  onClick: () => console.log('Clicked!'),
  disabled: false
};
```

**The mental model:** Think of conditional types as TypeScript's way of saying "If this type looks like that, then give me this other type, otherwise give me something else."

### Rule #2: Distributive Magic Happens with Naked Types

*"When you pass a union, TypeScript loops over each part — unless you stop it."*

This one took me way longer to understand, but it's incredibly powerful once it clicks.

When conditional types act on a generic type, they become distributive when given a union type. That means TypeScript automatically applies the conditional type to each member of the union separately.

**Here's the key:** This only happens with "naked" type parameters.

```sql
Copy// This is "naked" - T appears directly in the extends clause
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<'a' | 'b' | 'c'>;
// Result is: 'a'[] | 'b'[] | 'c'[]
// NOT: ('a' | 'b' | 'c')[]
```

**Why does this happen?** TypeScript takes the union `'a' | 'b' | 'c'` and distributes it:

- `'a' extends any ? 'a'[] : never` → `'a'[]`
- `'b' extends any ? 'b'[] : never` → `'b'[]`
- `'c' extends any ? 'c'[] : never` → `'c'[]`

Then it unions the results: `'a'[] | 'b'[] | 'c'[]`

**But here's how you can turn off this behavior** when you don't want it:

```typescript
Copy// Wrap T in brackets to make it "non-naked"
type NoDistribute<T> = [T] extends [any] ? T[] : never;

type Result2 = NoDistribute<'a' | 'b' | 'c'>;
// Result2 is: ('a' | 'b' | 'c')[]
```

**Real example:** Filtering types from a union.

```typescript
Copytype NonNullable<T> = T extends null | undefined ? never : T;

type Clean = NonNullable<string | null | number | undefined>;
// Clean is: string | number
// The null and undefined get filtered out automatically!
```

This distributive property can be used to filter union types, which is exactly how TypeScript's built-in `Exclude` utility type works.

### Rule #3: infer Lets You Peek Inside a Type

*"You can extract types from other types like a pattern matcher."*

The `infer` keyword was the final boss of my TypeScript learning journey. But once I understood it, everything clicked.

**Think of** **`infer`** **as saying:** "Hey TypeScript, I don't know what this type is yet, but when you figure it out, store it in this variable so I can use it."

Conditional types provide us with a way to infer from types we compare against in the true branch using the `infer`keyword.

Here's the classic example:

```typescript
Copytype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getName(): string { return "John"; }
function getAge(): number { return 25; }

type NameType = ReturnType<typeof getName>; // string
type AgeType = ReturnType<typeof getAge>;   // number
```

**What's happening here?**

1. We check if `T` looks like a function `(...args: any[]) => something`
2. If it does, we say "whatever that 'something' is, call it `R`"
3. Then we return `R`
4. If it doesn't look like a function, return `never`

**Let's build something more practical** — extracting array element types:

```typescript
Copytype ArrayElement<T> = T extends (infer U)[] ? U : never;

type StringArray = string[];
type NumberArray = number[];

type StringType = ArrayElement<StringArray>; // string
type NumberType = ArrayElement<NumberArray>; // number
type NotArray = ArrayElement<boolean>; // never
```

**Here's where it gets really powerful** — extracting component props:

```typescript
Copytype PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;

const MyButton: React.FC<{ label: string; onClick: () => void }> = (props) => (
  <button onClick={props.onClick}>{props.label}</button>
);

type MyButtonProps = PropsOf<typeof MyButton>;
// MyButtonProps is: { label: string; onClick: () => void }
```

**Multiple infer declarations** work too:

```typescript
Copytype FunctionInfo<T> = T extends (first: infer A, second: infer B) => infer R 
  ? { args: [A, B]; return: R } 
  : never;

type LoginFunction = (username: string, password: string) => Promise<boolean>;

type LoginInfo = FunctionInfo<LoginFunction>;
// LoginInfo is: { args: [string, string]; return: Promise<boolean> }
```

### Bonus Rule: Mapped Types Aren't Hard If You Start Small

Now that you understand conditional types and `infer`, mapped types will feel like a breeze.

**Mapped types transform existing types.** Think of them as a `for...in` loop for type properties.

```typescript
Copytype Optional<T> = {
  [K in keyof T]?: T[K];
}
```

**In plain English:** "For each property `K` in type `T`, make a new property with the same name but optional, and the same type `T[K]`."

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

**Let's build something more interesting** — converting all properties to strings:

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

**Combining mapped types with conditional types:**

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

### Putting It All Together: A Real-World Example

Let's build a type that extracts the payload type from Redux actions:

```typescript
Copy// Our action types
type LoginAction = { type: 'LOGIN'; payload: { username: string; password: string } };
type LogoutAction = { type: 'LOGOUT'; payload: null };
type UpdateProfileAction = { type: 'UPDATE_PROFILE'; payload: { name: string; email: string } };

type Actions = LoginAction | LogoutAction | UpdateProfileAction;

// Extract payload type for a specific action
type PayloadOf<T, ActionType extends string> = T extends { type: ActionType; payload: infer P } 
  ? P 
  : never;

// Usage
type LoginPayload = PayloadOf<Actions, 'LOGIN'>;
// LoginPayload is: { username: string; password: string }

type LogoutPayload = PayloadOf<Actions, 'LOGOUT'>;
// LogoutPayload is: null

type UpdatePayload = PayloadOf<Actions, 'UPDATE_PROFILE'>;
// UpdatePayload is: { name: string; email: string }
```

**What's happening:**

1. We use distributive conditional types to check each action in the union
2. We use `infer` to extract the payload type when the action type matches
3. TypeScript gives us exactly the payload type we need!

### Your Next Steps

Now that you understand these three rules, you'll start seeing patterns everywhere in TypeScript's built-in utility types:

- `Pick<T, K>` uses mapped types
- `Exclude<T, U>` uses distributive conditional types
- `ReturnType<T>` uses `infer`
- `Parameters<T>` combines conditional types with `infer`

**Here's my challenge to you:** Open up TypeScript's built-in utility types (you can find them in your editor's type definitions) and try to understand how they work using these three rules.

Start with `Partial<T>`, `Required<T>`, and `ReturnType<T>`. Once those make sense, move on to `Extract<T, U>` and `NonNullable<T>`.

### The Bottom Line

Advanced TypeScript types aren't magic. They're just three simple concepts:

1. **Conditional types** = if-else for types
2. **Distributive behavior** = automatic looping over unions
3. **infer** = pattern matching to extract types

Once you internalize these patterns, you'll stop being intimidated by complex type definitions. Instead, you'll start seeing opportunities to make your code more type-safe and expressive.

Mastering advanced types won't just impress your teammates — it'll **transform the way you model and refactor code**. You'll catch bugs at compile time that would have taken hours to debug in production.

**Ready to level up your TypeScript game?** Start by picking one utility type you use regularly and understanding how it works under the hood. Then build your own version from scratch.

Trust me, once you can read and write these types fluently, you'll wonder how you ever lived without them.

*What TypeScript type challenge are you working on? Drop a comment below and let's solve it together! And if this helped demystify advanced types for you, give it a clap and share it with a fellow developer who's stuck in type hell.*