## Parse

在 **baseCompile()** 执行过程中，首先就是通过 **parse方法** 解析 **template模板字符串**，生成对应的 AST 抽象语法树。

整个 **parse函数** 定义太长，这里省略几个内部方法

```typescript
/**
 * Convert HTML string to AST.
 */
export function parse(template: string, options: CompilerOptions): ASTElement {
  warn = options.warn || baseWarn
  platformIsPreTag = options.isPreTag || no
  platformMustUseProp = options.mustUseProp || no
  platformGetTagNamespace = options.getTagNamespace || no
  const isReservedTag = options.isReservedTag || no
  maybeComponent = (el: ASTElement) =>
    !!(
      el.component ||
      el.attrsMap[':is'] ||
      el.attrsMap['v-bind:is'] ||
      !(el.attrsMap.is ? isReservedTag(el.attrsMap.is) : isReservedTag(el.tag))
    )
  transforms = pluckModuleFunction(options.modules, 'transformNode')
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

  delimiters = options.delimiters

  const stack: any[] = []
  const preserveWhitespace = options.preserveWhitespace !== false
  const whitespaceOption = options.whitespace
  let root
  let currentParent
  let inVPre = false
  let inPre = false
  let warned = false

  function warnOnce(msg, range) {
  }

  function closeElement(element) {
  }

  function trimEndingWhitespace(el) {
  }

  function checkRootConstraints(el) {
  }

  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    
    start(tag, attrs, unary, start, end) {
    },

    end(tag, start, end) {},

    chars(text: string, start?: number, end?: number) {
    },
    
    comment(text: string, start, end) {
    }
  })
  return root
}
```

> 在 **parse()** 函数中，首先会定义以下方法：
>
> 1. 定义 warn 警告函数，用于在控制台显示错误提示
> 2. 获取 options 中的几个标签判断函数，并定义一个 Vue 组件的判断方法 **maybeComponent**：通过判断当前节点的 ast 对象的几个属性，来确实是不是一个组件
> 3. 之后定义标签的处理方法（都是方法数组）
>    - **transforms** ：包含 modules 配置中的两个处理方法，分别处理标签的 class 和 style
>    - **preTransforms**：专门用来处理 input 的动态绑定，比如 `<input v-model="data[type]" :type="type" />`
>    - **postTransforms**：这个在 web 端的模板编译是没有配置的，这里是一个空数组
> 4. **stack**：用来保存标签解析的一个栈，保证标签的匹配
> 5. 定义 **delimiters** 分隔符和其他的一些标志变量。
> 6. **trimEndingWhitespace**：删除传入 el 节点的尾随空格节点，这里会判断当前解析的标签不在 pre 标签内部
> 7. **closeElement**：处理节点的 if，else-if，else 等情况下的条件，并更新 **inVPre，inPre** 的状态
> 8. **checkRootConstraints**：检查组件根节点，警告不能使用 slot 或者 template 作为组件根节点，也不能在根节点使用 v-for 循环
> 9. 最后，定义核心的解析方法 **parseHTML**
>
> **这里面的大部分变量和方法都是闭包形式，会在整个解析过程中保持状态**

### parseHTML 函数配置 HTMLParserOptions

**parseHTML** 就负责解析 template 字符串，生成 ast 对象，并通过闭包的方式将结果保存到 parse 函数定义的 root 变量。函数接收 template 字符串 与 解析配置 options 两个参数，并且 options 需要包含以下四个方法：

> 1. **start**：用来解析标签的开始部分（匹配到标签开始部分时调用）
> 2. **end**：用来解析结束标签（匹配到标签结束部分时调用）
> 3. **chars **：文本处理，解析到文本部分时调用
> 4. **comment**：注释处理，用来解析注释部分，在碰到注释时调用
