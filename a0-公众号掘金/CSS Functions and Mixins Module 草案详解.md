# CSS Functions and Mixins Module 详解

## 前言

CSS 自定义属性（CSS Custom Properties）为开发者提供了强大的能力，可以在一个地方定义有用且复杂的值，然后在整个样式表中重复使用。它们可以在文档中变化，或基于媒体查询或其他条件，使其非常灵活和响应式。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

然而，自定义属性的值在定义时是固定的，除了完全覆盖之前的定义外，无法更改。这是作者在大量使用复合变量时常见的困惑来源。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

为了解决这个问题，W3C 正在制定 CSS Functions and Mixins Module 规范，引入了自定义函数（Custom Functions）的概念。

## 什么是 CSS 自定义函数

自定义函数为开发者提供了与自定义属性相同的能力，但是参数化的：它们具有与自定义属性定义相同的灵活性和条件性，但在使用时从其他自定义属性（或显式作为参数）获取值。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

### 传统自定义属性的局限性

考虑以下传统自定义属性的例子：

```css
.element {
  --shadow: 2px 2px var(--shadow-color);
  --shadow-color: blue;
}
```

在这种情况下，`--shadow` 从声明它的元素获取 `--shadow-color` 值，后代元素对 `--shadow-color` 的更改不会改变它们的 `--shadow` 值。

### 自定义函数的解决方案

使用自定义函数，我们可以这样定义：

```css
@function --shadow(--shadow-color <color> : inherit) {
  /* 如果没有传递 --shadow-color 参数，
     或者没有成功解析为 <color>，
     尝试使用元素的 --shadow-color *属性* */

  /* var(--shadow-color) 引用 --shadow-color 参数，
     而不是自定义属性，
     但仍然可以像往常一样使用回退值 */
  result: 2px 2px var(--shadow-color, black);
}

.foo {
  --shadow-color: blue;
  box-shadow: --shadow(); /* 产生蓝色阴影 */
  /* 或者直接传参 */
  box-shadow: --shadow(blue);
}
```

## @function 规则详解

### 基本语法

`@function` 规则定义一个自定义函数，包含名称、参数列表、函数体，以及可选的返回类型。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

```css
@function <function-token> <function-parameter>#? )
  [ returns <css-type> ]?
{
  <declaration-rule-list>
}
```

其中：
- `<function-parameter>` = `<custom-property-name> <css-type>? [ : <declaration-value> ]?`
- `<css-type>` = `<syntax-component> | <type()>`
- `<type()>` = `type( <syntax> )`

### 函数命名规则

函数名必须以两个连字符（`--`）开头，类似于 `<dashed-ident>`，否则定义无效。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

### 参数类型定义

如果函数参数或返回类型的 `<css-type>` 可以用单个 `<syntax-component>` 描述，则可以省略 `type()` 函数：<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

```css
@function --foo(--a <length>) { /* ... */ }
@function --foo(--a <color>) { /* ... */ }
@function --foo(--a <length>+) { /* ... */ }
```

但是，任何需要 `<syntax-combinator>` 的 `<syntax>` 都需要包装在 `type()` 函数中：

```css
@function --foo(--a type(<number> | <percentage>)) { /* ... */ }
```

## 实际应用示例

### 简单的数值取反函数

```css
@function --negative(--value) {
  result: calc(-1 * var(--value));
}

html {
  --gap: 1em;
  padding: --negative(var(--gap));
  /* 或者直接传值 */
  padding: --negative(1em);
}
```

### 复杂的阴影函数

```css
@function --box-shadow(
  --x <length> : 0px,
  --y <length> : 0px, 
  --blur <length> : 0px,
  --color <color> : black
) {
  result: var(--x) var(--y) var(--blur) var(--color);
}

.card {
  box-shadow: --box-shadow(2px, 4px, 8px, rgba(0,0,0,0.1));
}

.elevated-card {
  box-shadow: --box-shadow(4px, 8px, 16px, rgba(0,0,0,0.2));
}
```

## 作用域和层叠

`@function` 规则的名称是树作用域名称。如果给定名称存在多个 `@function`，则更强层叠层中的规则获胜，在同一层内后定义的规则获胜。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

如果函数参数包含相同的 `<custom-property-name>` 多次，则 `@function` 规则无效。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

## 与现有技术的对比

### vs CSS 自定义属性

| 特性 | 自定义属性 | 自定义函数 |
|------|------------|------------|
| 参数化 | ❌ | ✅ |
| 动态计算 | ❌ | ✅ |
| 类型检查 | ❌ | ✅ |
| 默认值 | ✅ | ✅ |
| 作用域 | ✅ | ✅ |

### vs CSS 预处理器函数

| 特性 | 预处理器函数 | CSS 自定义函数 |
|------|--------------|----------------|
| 运行时计算 | ❌ | ✅ |
| 浏览器原生支持 | ❌ | ✅ |
| 媒体查询响应 | ❌ | ✅ |
| 构建步骤 | 需要 | 不需要 |

## 浏览器支持和未来展望

目前，CSS Functions and Mixins Module 仍处于工作草案阶段，尚未得到浏览器的广泛支持。但这个规范代表了 CSS 发展的重要方向，将为开发者提供更强大、更灵活的样式定义能力。

### 预期优势

1. **减少代码重复**：通过参数化函数避免重复的样式定义
2. **提高可维护性**：集中管理复杂的样式逻辑
3. **增强类型安全**：通过类型定义减少样式错误
4. **运行时灵活性**：支持动态参数和条件逻辑

### 未来的 Mixins 支持

规范提到，未来还将定义 "mixins"，这些是在样式规则级别操作的函数，将进一步扩展 CSS 的能力。<mcreference link="https://www.w3.org/TR/2025/WD-css-mixins-1-20250515/" index="0">0</mcreference>

## 总结

CSS Functions and Mixins Module 为 CSS 带来了函数式编程的概念，解决了自定义属性的局限性。虽然目前还在草案阶段，但它展示了 CSS 未来发展的方向，将使样式表更加模块化、可维护和强大。

开发者应该关注这个规范的发展，为未来的 CSS 开发做好准备。随着浏览器支持的逐步完善，自定义函数将成为现代 CSS 开发的重要工具。