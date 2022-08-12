## ParseHTML函数 - HTML 模板解析

之前在解析 parse 函数时，我们知道整个 **解析 template 模板并生成 ast 对象** 的过程都发生在这个函数的执行过程中。但是 **parse** 函数内部本身只定义了一些标签、指令的处理方法和警告函数，并且在传递给 **parseHTML** 函数的参数中定义了四个处理方法。最终是通过调用 **parseHTML** 来解析 template 模板

整个解析过程，其实就是 **通过一系列正则表达式来匹配 template 模板字符串，并截取该部分匹配内容并重新匹配剩余部分，直到全部匹配完成。**

所有的正则表达式包含以下内容：

```javascript
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/  // 静态属性解析
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // 动态属性解析（含有 v-xxx:, :, @, # 的属性）
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)   // 开始标签部分
const startTagClose = /^\s*(\/?)>/                     // 开始标签结束
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)// 结束标签部分
const doctype = /^<!DOCTYPE [^>]+>/i                   // DOCTYPE 声明
const comment = /^<!\--/                               // 注释部分
const conditionalComment = /^<!\[/                     // 条件注释
```

而 **parseHTML** 的简要代码如下：

```typescript
export function parseHTML(html, options: HTMLParserOptions) {
  const stack: any[] = []
  const expectHTML = options.expectHTML
  const isUnaryTag = options.isUnaryTag || no
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  let index = 0
  let last, lastTag
  while (html) {
    last = html
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf('<')
      if (textEnd === 0) {
        if (comment.test(html)) {
          // 处理 注释
          advance()
          continue
        }
        if (conditionalComment.test(html)) {
          // 处理 条件注释
          advance()
          continue
        }

        // Doctype:
        if (html.match(doctype)) {
          advance()
          continue
        }

        // 结束:
        if (html.match(endTag)) {
          advance()
          parseEndTag()
          continue
        }

        // 开始:
        if (parseStartTag()) {
          advance()
          handleStartTag()
          continue
        }
      }
      
      // 处理纯文本
      options.chars()
      advance()
    } else {
      // 结束
      parseEndTag()
    }

    if (html === last) {
      options.chars && options.chars(html)
      break
    }
  }

  parseEndTag()

  function advance(n) {
  }

  function parseStartTag() {
  }

  function handleStartTag(match) {
  }

  function parseEndTag(tagName?: any, start?: any, end?: any) {
  }
}
```

其中定义了三个标签处理方法和一个定位方法：

- **advance** 方法是更新当前解析到的文本位置 index，并截取掉已解析的部分
- **parseStartTag** 方法用来解析标签的开始部分，内部会生成一个包含标签名 tagName 和属性数组 attrs 的对象 math，并循环解析内部的字符串直到解析完整个字符串，将解析到的属性存放到 attrs 数组中
- **handleStartTag** 则是处理 **parseStartTag** 得到的 math 对象（大部分是处理每个属性），如果上面解析到是非闭合标签的话，也会将这个 math 对象修改成一个新对象插入到 **parseHTML** 执行时定义的 stack 元素栈中；当然，如果是自闭合标签，还会调用 **parseEndTag** 方法处理；并在 **最后调用** options 中定义的 **start** 函数来生成 ast 对象
- **parseEndTag** 方法就用来处理标签结束后的逻辑，会根据条件清除 stack 栈中的元素；如果此时元素标签是 br 或者 p，也会调用 option.start()，其他情况下一般会调用 options.end() 来结束当前标签的解析

> **总的来说，parseHTML 就是通过正则表达式来匹配不同的标签和属性，进行不同的标签/属性处理，最后通过 options 中的回调函数来创建完整的 ast 对象；并用 stack 元素栈的方式来保证原始 template 模板与 ast 对象的层级结构的一致性。**

