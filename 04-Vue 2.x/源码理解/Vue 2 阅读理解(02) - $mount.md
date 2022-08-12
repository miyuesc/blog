## 1. $mount 函数来源

上一节虽然直接从 **core** 目录下找到了 **Vue** 的构造函数定义，但是缺少 **$mount** 方法。所以直接从开发过程中使用的 **vue.esm.js** 找到对应的源码入口。根据 **scripts/config.js** 中可以找到 **vue.esm.js** 的构建入口是 **entry-runtime-with-compiler-esm.ts**，这个文件没有最终也是依赖的 **runtime-with-compiler.ts**。

这里放一下依赖关系：

```typescript
// src/platforms/web/entry-runtime-with-compiler-esm.ts
import Vue from './runtime-with-compiler'

export default Vue


// src/platforms/web/runtime-with-compiler.ts
import Vue from './runtime/index'

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function(el?: string | Element, hydrating?: boolean): Component {
  // ...
  const options = this.$options
  // ...
  return mount.call(this, el, hydrating)
}
Vue.compile = compileToFunctions
export default Vue


// src/platforms/web/runtime/index.ts
import Vue from 'core/index'
import { mountComponent } from 'core/instance/lifecycle'
import { patch } from './patch'

// ... 处理 Vue.config
// ... 处理 Vue.options
Vue.prototype.__patch__ = inBrowser ? patch : noop
Vue.prototype.$mount = function (el?: string | Element, hydrating?: boolean ): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

export default Vue
```

> 在 **src/platforms/web/runtime/index.ts** 中对 Vue 构造函数还做了其他处理，这里就先不看了。

## 2. runtime 运行时的 $mount 函数

在 **src/platforms/web/runtime/index.ts** 中定义的 **$mount** 函数就是调用了 **mountComponent** 方法并返回其结果，所以核心依然在 **mountComponent**  函数

### 2.1 mountComponent 函数

```typescript
export function mountComponent(vm: Component, el: Element | null | undefined, hydrating?: boolean ): Component {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (__DEV__) {
      // 这里是判断开发环境，如果有配置模板或者el属性，则警告需要将模板编译成渲染函数，或者使用包含编译器的部分。
    }
  }
  callHook(vm, 'beforeMount')

  let updateComponent

  if (__DEV__ && config.performance && mark) {
    // 处理开发环境中，配置了 性能分析时的处理，会在组件中创建对应的dom标签（class）
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // 渲染watcher，在执行前触发 beforeUpdate 调用对应钩子函数
  const watcherOptions: WatcherOptions = {
    before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }

  new Watcher( vm, updateComponent, noop, watcherOptions, true)
  
  hydrating = false

  // 这个是配合 2.7 添加的 setup 处理
  const preWatchers = vm._preWatchers
  if (preWatchers) {
    for (let i = 0; i < preWatchers.length; i++) {
      preWatchers[i].run()
    }
  }

  // 手动挂载实例，并且在首次挂载（$vnode为空）时触发 mounted
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

> 这里的逻辑也比较简单（省略掉了性能分析）
>
> - 首先判断 **render 渲染函数**，没有则将 render 属性配置为一个创建空节点的函数
> - 调用在 **lifecycleMixin(Vue)** 中定义的 **_update** 方法来对比和更新 **VNode**，并渲染到 dom 节点上
> - 实例化一个 **Render Watcher** ，并在每次更新 dom 之前触发 **beforeUpdate**
> - 在2.7+版本，根据 **setup** 中定义的预执行的 **watcher** 函数分别调用 **watcher.run** 执行一次
> - 最后修改实例状态 **_isMounted**，并触发 **mounted**，返回组件实例对象

### 2.2 _update 函数（首次渲染）

函数大致代码如下

```typescript
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    if (!prevVnode) {
      // 首次渲染
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // 更新
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    
    prevEl && (prevEl.__vue__ = null)
    vm.$el && (vm.$el.__vue__ = vm)
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
  }
```

> 这里主要是记录组件实例在更新前的 **$el** 和 **_vnode** 两个属性，用来在后面的 `__path__` 方法中进行比较和更新（也就是常说的 diff），最后将实例的 **$el** 属性的 `__vue__` 指向当前实例，并处理高阶函数组件的正确dom。


> 🚀🚀 这里通过 **setActiveInstance(vm)** 函数，用闭包的形式将 **当前组件实例** 导出到了外部，后面的 **patch** 使用的实例也就是该实例（**translation** 组件也会使用该实例）

## 3. runtime-with-compiler 的 $mount 函数

上文说到了 **runtime-with-compiler.ts** 中对 **Vue** 构造函数上的 **$mount** 函数进行了重写，并且原始的 **$mount** 函数也会在执行时进行相关检查。

```typescript
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (el?: string | Element, hydrating?: boolean ): Component {
  el = el && query(el)

  if (el === document.body || el === document.documentElement) {
    __DEV__ &&  warn(`Do not mount Vue to <html> or <body> - mount to normal elements instead.`)
    return this
  }

  const options = this.$options
  if (!options.render) {
    let template = options.template
    if (template) {
      // 区分template的类型并验证，最后转成字符串
    } else if (el) {
      template = getOuterHTML(el)
    }
    // 根据 template 字符串生成一个 render 函数
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

> 这里的作用其实就是编译 template 模板的过程，并且在函数执行时会检查挂载的dom节点类型，不能挂载到 body 或者 html 上。
>
> 因为本身的 **mount** 方法（也就是 **mountComponent**）只能使用 **vm.render()** 生成的 **VNode** 来进行 **patch** 和生成真实 dom。

## 4. runtime 对 Vue 构造函数的其他修改

上面说的 **runtime/index.ts** 中第一次定义了 **Vue** 上的 **_mount** 方法和 `__patch__` 方法；同时，这里还在 **Vue** 构造函数上增加了其他方法。

```typescript
// 定义 web 端特定的工具函数
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// 定义相关指令和组件
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)
```

> 上面的几个方法主要有以下作用：
>
> 1. mustUseProp： 定义哪些dom元素必须使用 props 绑定参数（默认有 input，option，select 等）
> 2. isReservedTag：判断标签是不是默认保留的标签
> 3. isReservedAttr：判断是不是标签保留属性，这里只有 class 和 style
> 4. getTagNamespace：判断标签的类别，这里只区分 SVG 元素和 math 标签
> 5. isUnknownElement：判断未知元素
>
> 然后定义了以下指令和方法：
>
> 1. 注册 v-model 和 v-show 指令
> 2. 注册 Transition 和 TransitionGroup 动画组件

-----

patch 方法比较难，篇幅有限下次讲