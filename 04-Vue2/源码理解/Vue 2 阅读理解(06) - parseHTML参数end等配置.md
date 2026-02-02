## HTMLParserOptions.end()

在解析到标签结束部分时被调用，这部分代码主要用来处理之前的 **stack** 元素栈

```typescript
function end(tag, start, end) {
  const element = stack[stack.length - 1]
  stack.length -= 1
  currentParent = stack[stack.length - 1]
  if (__DEV__ && options.outputSourceRange) {
    element.end = end
  }
  closeElement(element)
},
```

这部分逻辑很简单：

- 首先是取出当前元素保存到 element （ast）对象中，用来后面调用 **closeElement()** 方法时校验该元素解析结果并闭合该标签
- 然后将 stack 栈的长度减少 1，并重新设置当前解析元素的父元素 currentParent 为上一个栈中元素
- 如果是开发环境并且开启了源代码位置定位的，还会把结束位置插入到当前元素的 ast element 对象中

## HTMLParserOptions.chars()

在解析到文本输出时被调用，这部分代码主要用来处理文本出现的 **异常位置警告** 、**处理文本字符串** 和 **生成文本 ast 对象**

```typescript
chars(text: string, start?: number, end?: number) {
  // 第一部分：判断
  if (!currentParent) {
    if (__DEV__) {
      if (text === template) warnOnce('')
      if ((text = text.trim())) warnOnce('')
    }
    return
  }
  if (isIE && currentParent.tag === 'textarea' && currentParent.attrsMap.placeholder === text) {
    return
  }
  
  // 第二部分：处理
  const children = currentParent.children
  if (inPre || text.trim()) {
    text = isTextTag(currentParent) ? text : (decodeHTMLCached(text) as string)
  } else if (!children.length) {
    text = ''
  } else if (whitespaceOption) {
    if (whitespaceOption === 'condense') {
      text = lineBreakRE.test(text) ? '' : ' '
    } else {
      text = ' '
    }
  } else {
    text = preserveWhitespace ? ' ' : ''
  }
  
  // 第三部分：生成 ast
  if (text) {
    if (!inPre && whitespaceOption === 'condense') {
      text = text.replace(whitespaceRE, ' ')
    }
    let res
    let child: ASTNode | undefined
    if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
      child = {
        type: 2,
        expression: res.expression,
        tokens: res.tokens,
        text
      }
    } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
      child = { type: 3, text }
    }
    if (child) {
      if (__DEV__ && options.outputSourceRange) {
        child.start = start
        child.end = end
      }
      children.push(child)
    }
  }
}
```

**1. 异常位置警告（校验文本位置 ）**

这里有两种判断：

- 当 **没有父节点** 的时候（即此时的文本在组件的最外层位置），如果直接出现了文本，则退出函数并报错

  > 如果一个组件下 **只有文本节点** （即 解析的text === template 模板），则警告组件下必须有根节点，不能只是文本
  >
  > 如果还有其他节点（即取消尾部空格后不是空字符串），则警告该部分字符串会被忽略无法渲染

- 修复 ie 浏览器下textare 标签的 placeholder 异常

**2. 处理文本字符串**

这里首先会获取父节点的 **子节点数组**，也就是 **currentParent.children**，然后对该文本部分进行处理（按照标签格式、子节点数量、空格删除配置等方式进行转换）。

**3. 生成文本 ast 对象**

这里首先会压缩原文本的空格符合换行符，将连续的这些字符转换成一个空格符。之后进行判断并处理 ast 对象

> 1. 当前文本节点 **不在 v-pre 声明** 的标签内部且 **不是一个空格字符**，并且解析到特殊标识（双大括号等），才创建文本 ast 对象
>
>    此时会循环匹配结果并生成条件字符串，以及对应的解析 token，此时节点 ast 的类型为2
>
>    ***这里会使用 parseText 方法来解析该文本，具体 parseText 的解析过程在后面讲***
>
> 2. 如果文本节点 **不是一个空格字符**，或者父节点长度为0，或者 **上一个同级子节点** 也不是一个空格字符，才创建文本 ast 对象

当经过上面的判断之后有文本节点 ast 对象的话，才将该对象插入到父节点的 children 数组中。

## HTMLParserOptions.comment()

在解析到注释部分的时候调用，用来处理注释节点

```typescript
function comment(text: string, start, end) {
  if (currentParent) {
    const child: ASTText = {
      type: 3,
      text,
      isComment: true
    }
    if (__DEV__ && options.outputSourceRange) {
      child.start = start
      child.end = end
    }
    currentParent.children.push(child)
  }
}
```

这里进行一次判断，只有内部的注释标签内容才会生成 ast 对象，与根节点同级的注释将直接忽略。

