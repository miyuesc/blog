## HTMLParserOptions.start()

用来解析标签的开始部分（匹配到标签开始部分时调用），主要区分标签类型、解析标签指令配置与动态绑定参数等等。

```typescript
let root
let currentParent

function start(tag, attrs, unary, start, end) {
  const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

  if (isIE && ns === 'svg') attrs = guardIESVGBug(attrs)

  let element: ASTElement = createASTElement(tag, attrs, currentParent)
  if (ns) element.ns = ns

  if (__DEV__) {
    if (options.outputSourceRange) {
      element.start = start
      element.end = end
      element.rawAttrsMap = element.attrsList.reduce((cumulated, attr) ={
        cumulated[attr.name] = attr
        return cumulated
      }, {})
    }
    attrs.forEach(attr =invalidAttributeRE.test(attr.name) && warn(''))
  }

  if (isForbiddenTag(element) && !isServerRendering()) {
    element.forbidden = true
    __DEV__ && warn('')
  }

  for (let i = 0; i < preTransforms.length; i++) {
    element = preTransforms[i](element, options) || element
  }

  if (!inVPre) {
    processPre(element)
    if (element.pre) inVPre = true
  }
  if (platformIsPreTag(element.tag)) inPre = true
  
  if (inVPre) processRawAttrs(element)
  else if (!element.processed) {
    processFor(element)
    processIf(element)
    processOnce(element)
  }

  if (!root) {
    root = element
    if (__DEV__) checkRootConstraints(root)
  }

  if (!unary) {
    currentParent = element
    stack.push(element)
  } else {
    closeElement(element)
  }
},
```

**start** 函数在解析完标签的开始部分后被调用，接收的五个参数分别是：标签名 tag，标签的属性数组 attrs，是否自闭合 unary，起点位置 start，结束位置 end

1. 进入函数之后，首先会验证 **当前元素的父元素的标签命名空间（svg，math或者undefined）**，如果是 svg 元素，还会对解析出来的 attrs 对象进行处理，去掉 **svg 标签定义属性（xmlns 之类的属性）**

2. 调用 **createASTElement(tag, attrs, currentParent)** 方法创建当前元素对应的 **AST 对象 element**。此时结构如下：

```json
{
  type: 1,
  tag: tag,
  attrsList: attrs,
  attrsMap: makeAttrsMap(attrs),
  rawAttrsMap: {},
  parent: currentParent,
  children: []
}
```

3. 在开发环境下，还会将节点在字符串中的位置与节点原有的属性进行记录，并且 **校验属性名** 是否合法（禁止空格，引号，尖括号，反斜杠和等号）

4. **校验标签合法性**，如果是 style，script 之类的标签会被标记为“被禁止”（**element.forbidden = true**）

5. 遍历 **preTransforms** 数组配置的处理函数，分别处理当前节点的 ast 结果，并重新更新节点的 ast 对象（这里只处理 input）

这里处理后的 input ast element，会比基础的 ast element 要多一些属性：

```json
{
attrs: [],
attrsList: [],
attrsMap: { 'v-model': 'xxx' },
chidlren: [],
derectives: [{ isDynamicArg: false, modifiers: undefined, name: 'model', rawName: 'model', value: 'xxx' }],
events: {
 input: { dynamic: undefined, value: "if($event.target.composing)return;xxx=$event.target.value" }
},
hasBindings: true,
parent: currentParent,
plain: false,
props: [{ dynamic: undefined, name: 'value', value: '(xxx)' }],
rawAttrsMap: {},
static: false
}
```

> 虽然上面也省略了几个属性和部分属性值，但是重点属性都在里面。在 **preTransforms** 过程中，实际上是通过 **preTransformNode()** 函数处理 **input** 标签，并且该标签具有 **v-model** 配置，没有 v-model 时直接退出。
>
> 之后会判断该元素是否有动态绑定类型，如果是 **动态绑定的元素类型**，则会增加一个 **ifConditions** 配置，内部会填充 checkbox， radio 和 其他 input 类型的标签，用来根据不同的情况显示不同的展示形式（个人理解这里为什么只有三种，是因为 checkbox 和 radio 与其他的 input 输入框差别比较大，而且需要 label 标签配合）
>

6. 判断元素有没有设置 v-pre 指令或者是一个 pre 标签，重新设置 **inVPre， inPre** 的状态
7. 如果此时 **inVPre === true**，则直接跳过这个节点内部的编译；否则会依次判断 v-for，v-if 和 v-once 配置并进行编译

> **这里会先判断 for 循环再判断 if 条件，所以才有 for 的优先级高于 if。**
>
> - 如果存在 v-for，会在 ast 对象中添加 **for** 和 **forProcessed** 属性，并解析条件；如果内部有文本节点要显示循环的值，则会在标签最末级创建一个文本节点并绑定显示条件
> - 如果存在 v-if，会在 ast 对象中添加 **if** 和 **ifProcessed** 属性，并添加一个 **ifConditions** 属性，存放不同条件下的 ast 节点对象和渲染条件
> - 如果有 v-once，一样会在 ast 对象中添加 **once** 和 **onceProcessed**，并且会标记 **staticProcessed**

8. 上面的过程执行完之后，如果此时外部的 root 是 undefined，则会将当前的节点作为根元素赋值给 root，并调用 **checkRootConstraints** 检查根节点

9. 如果当前节点是一个自闭合标签，则直接调用 **closeElement** 结束该节点；不然则将该节点赋值给 currentParent 并插入 stack 解析栈，以供子节点的解析