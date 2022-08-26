## template compile 模板解析

在 **runtime-with-compiler.ts** 中，Vue 构造函数的 **$mount** 被重写，添加了对于 template 模板的解析部分。

```typescript
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (el?: string | Element, hydrating?: boolean): Component {
  el = el && query(el)

  if (el === document.body || el === document.documentElement) {
    __DEV__ && warn('')
    return this
  }

  const options = this.$options
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          if (__DEV__ && !template) {
            warn('')
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        __DEV__ && warn('')
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      const { render, staticRenderFns } = compileToFunctions(
        template,
        {
          outputSourceRange: __DEV__,
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments
        },
        this
      )
      options.render = render
      options.staticRenderFns = staticRenderFns
    }
  }
  return mount.call(this, el, hydrating)
}
```

> 上面的源代码省略了性能分析部分。

当然，既然是编译 template，那么肯定是建立在有 template 配置的基础上，但是因为 render() 方法的优先级高于 template，所以这里采用的是判断不存在 render 属性执行模板编译。

这段代码的大致逻辑如下：

> 1. 判断 el 挂载节点，会校验 **不能挂载到 html 和 body** 上。
> 2. 判断不存在 render 配置，执行 **template compile** 模板编译

**整个模板编译过程又分为：“模板字符串查询” 和 “render函数转换”**

### 1. 模板字符串查询

模板字符串查询 分为以下两种情况：

**1. 存在 template 配置：**

> - 如果 template 是字符串，且以 **#** 开头，则将该属性视为节点 id 进行获取，并将结果转为 html 字符串重新赋值给 template 变量；如果字符串 **不以 # 开头** 或者 **获取结果不存在**，则报错并直接退出该函数
> - 如果 template 具有 **nodeType** 属性，则表示 template 就是一个 dom 节点，就直接使用 **innerHTML** 获取该节点的 html 字符串并重新赋值给 template 变量
> - template 既不是 id 字符串也不是 dom 节点，则直接退出函数并报错：非法 template 配置
>
> > 这种情况采用的都是 **element.innerHTML** 属性，即只取用配置节点内部的子节点

**2. 不存在 template 但是有 el 对应的节点：**

> 因为上文已经查询过 el 配置对应的 dom 节点，所以这里的 el 要么是 undefined，要么就是一个真实 dom
>
> - 如果 el 节点有 outerHTML 属性，则将 template 变量设置为 el.outerHTML
> - 否则创建一个新的 div 节点 **container**，并在 container 中插入一个 el 节点的复制节点，将 template 变量设置为 container.innerHTML

如果经过上面的步骤之后，查询到了对应的 template 模板字符串，则进行后续的模板编译；否则直接调用缓存的 mount 方法直接进行后续操作（也就是最初定义的 Vue.prototype.$mount，将实例的 render 方法直接绑定为一个创建空节点的方法）

### 2. render函数转换

这里的逻辑主要在 **compileToFunctions** 函数中

```typescript
const { render, staticRenderFns } = compileToFunctions(
  template,
  {
    outputSourceRange: __DEV__,
    shouldDecodeNewlines,
    shouldDecodeNewlinesForHref,
    delimiters: options.delimiters,
    comments: options.comments
  },
  this
)
```

而 **compileToFunctions** 来自于 **createCompiler**

```typescript
import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

const { compile, compileToFunctions } = createCompiler(baseOptions)
export { compile, compileToFunctions }

// 这里的 baseOptions 包含以下内容
export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules, // 处理 class，style 绑定 和 v-model 语法糖
  directives, // 处理 v-model,v-text,v-html 指令
  isPreTag, // 判断 pre 标签
  isUnaryTag, // 判断 link，meta，source，input 之类的可闭合标签
  mustUseProp, // 判断 input，textarea，option 之类的标签，只可以使用 prop 绑定特定属性
  canBeLeftOpenTag, // 判断可以只需要开启部分的标签
  isReservedTag, // 判断是不是 html 或者 svg 保留标签
  getTagNamespace, // 获取 svg 类标签和 math 标签
  staticKeys: genStaticKeys(modules) // 返回由 modules 的每个模块的staticKeys组成的字符串
}
```

**createCompiler** 则是来自 **createCompilerCreator** 的执行结果。

```javascript
export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
```

**createCompilerCreator** 函数接收一个 **baseCompile** 函数作为参数，返回一个接收 **CompilerOptions** 参数并返回 **compile，compileToFunctions** 的对象。而 **compileToFunctions** 方法则是来自于 **createCompileToFunctionFn(compile)**

### 3. baseCompile 函数

该函数接收一个 template 模板字符串（也就是前面通过模板字符串查询得到的结果）和一个编译配置，返回一个包含抽象语法树等属性的对象。

- **ast**：由 template 模板得到的 dom 节点关系的 AST 抽象语法树，如果有配置 **optimize** ，还会调用 **optimize(ast, options)**进行优化
- **render**：由 **generate** 方法生成的渲染方法，主要是通过 **遍历 ast** 来拼接一个由 **_c(xxx)** 等方法组成的字符串，这些方法都在定义 Vue 构造函数时被定义的。
- **staticRenderFns**：与 render 类似，但是只有在 template 是纯静态节点的时候有返回值

```javascript
template: "<div class='demo-vm-2'>" +
            "<h2>Demo VM 2</h2>" +
            "<p>demo2 data is: {{ data2 }}</p>" +
            "<p>demo2 props data is: {{ result }}</p>" +
            "<span>test span</span>" +
            "<button @click='demoClick2'>button2</button>" +
            "<br />" +
            "<input :value='changeMessage' />" +
            "<slot name='slot1'></slot>" +
            "<slot></slot>" +
            "<demo-vm-three></demo-vm-three>" +
            "<demo-vm-four></demo-vm-four>" +
            "</div>"
== 编译后 ==>
render：`with(this){return _c('div',{staticClass:"demo-vm-2"},[_c('h2',[_v("Demo VM 2")]),_c('p',[_v("demo2 data is: "+_s(data2))]),_c('p',[_v("demo2 props data is: "+_s(result))]),_c('span',[_v("test span")]),_c('button',{on:{"click":demoClick2}},[_v("button2")]),_c('br'),_c('input',{domProps:{"value":changeMessage}}),_t("slot1"),_t("default"),_c('demo-vm-three'),_c('demo-vm-four')],2)}`


template: "<div class='demo-vm-4'>" +
            "<h2>Demo VM 4</h2>" +
            "</div>"
== 编译后 ==>
staticRenderFns: ["with(this){return _c('div',{staticClass:\"demo-vm-4\"},[_c('h2',[_v(\"Demo VM 4\")])])}"]
```

这里的 **render** 和 **staticRenderFns** 返回值都是一个 **with** 函数，通过内部的字符串编译成 JavaScript 脚本并指定内部环境变量为当前 实例 this

### 4. compile 函数

**compile** 函数由 **createCompiler** 函数创建，接收 template 模板字符串和 baseOptions 编译配置，并通过闭包的方式使用上面的 **baseCompile** 方法来编译 template 模板。

> 最终 **compile** 函数内部核心逻辑就是将 **compileToFunctions()** 传入的编译配置项和 baseOptions 基础配置项合并为一个配置项 **finalOptions**，并通过 **baseCompile(template, finalOptions)** 来得到最终的组件渲染函数。	
