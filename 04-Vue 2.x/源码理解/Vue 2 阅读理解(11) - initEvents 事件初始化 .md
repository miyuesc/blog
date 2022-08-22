## initEvents 组件事件初始化

在 **initLifecycle** 初始化生命周期执行结束后，紧接着就是执行 **initEvents(vm)** 来初始化实例的事件绑定。

这里的事件指的是在组件或者元素上通过 **v-on** 或者 **@** 作为属性前缀的自定义元素属性，在 Vue 中会解析为自定义事件。

### 1. 查询和解析事件

在之前的 **compile** 模板解析部分，最终会调用 **parseHTML()** 方法来解析模板字符串并生成 **AST 对象**；并且在调用该函数之前定义了 **closeElement(), start(), end()** 几个方法，用来处理解析到不同数据时的处理方法。

其中，如果是自闭合标签，会在 **start()** 方法中直接调用 **closeElement()** 结束这个标签的解析，否则则在解析到结尾标签的时候通过 **end()** 方法来调用 **closeElement()** 结束处理。而在 **closeElement** 方法里面，就会通过 **processElement** 来处理 Vue 关键字属性和其他属性。这里事件定义部分也会当做普通属性，解析到 ast 对象的 **attrs** 和 **attrsList** 中，但是一个新属性（events）用来标注事件。

大致格式如下：

```json
{
  attrs: [],
  attrsList: [
    {
      "name": "v-on:click.stop",
      "value": "demoTwoClick",
      "start": 599,
      "end": 624
    },
    {
      "name": "@change-watch",
      "value": "demoTwoChange",
      "start": 625,
      "end": 654
    }
  ],
  attrsMap: {
    "ref": "demoTwo",
    "key": "demo2",
    "v-on:click.stop": "demoTwoClick",
    "@change-watch": "demoTwoChange"
  },
  events: {
    "click": {
      "value": "demoTwoClick",
      "dynamic": false,
      "modifiers": { stop: true },
      "start": 599,
      "end": 624
    },
    "change-watch": {
      "value": "demoTwoChange",
      "dynamic": false,
      "start": 625,
      "end": 654
    }
  }
}
```

> **attrs** 数组会对绑定属性进行处理，剔除掉事件定义部分；**attrsList** 则包含完整的属性配置；**attrsMap** 包含属性的属性配置名和属性值的对应关系。

整个事件的解析过程大致为： **processElement() => processAttrs() => addHandler()** 。最终会生成一个字符串拼接到 render 函数的执行中，用来创建 VNode 与真实 DOM

> **在某个组件的模板内部的 html 原始元素上定义的事件，都 “不会” 被解析到组件的事件系统中。但是会在对应元素节点的 AST 对象上增加一个事件绑定，并将事件函数上下文指定为当前实例**

### 2. initEvents 事件对象初始化

这部分都用来解析组件上的事件绑定，所以内部的函数命名都与 **component** 相关，源码位于 **src/core/instance/events.ts**

```typescript
export function initEvents(vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

export function updateComponentListeners(vm: Component, listeners: Object, oldListeners?: Object | null) {
  target = vm
  updateListeners(
    listeners,
    oldListeners || {},
    add,
    remove,
    createOnceHandler,
    vm
  )
  target = undefined
}
```

这里首先会在实例上创建一个空对象属性 **_events** ，用来保存组件事件；并创建一个生命周期监听事件的标识属性 **_hasHookEvent**。

然后读取父组件的注册事件，如果存在事件，则调用 **updateComponentListeners** 将事件注册到子组件实例中。



而 **updateComponentListeners** 函数内部的定义也十分简单，就是 **指定 this 指向** 并调用 **updateListeners** 注册事件。

```typescript
export function updateComponentListeners(vm: Component, listeners: Object, oldListeners?: Object | null) {
  target = vm
  updateListeners(
    listeners,
    oldListeners || {},
    add,
    remove,
    createOnceHandler,
    vm
  )
  target = undefined
}
```

### 3. updateListeners 事件注册

该函数位于 **src/core/vdom/helpers/update-listeners.ts** 内，主要是根据上面解析出来的事件定义来注册对应的事件，其函数定义如下：

```typescript
export function updateListeners(
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  createOnceHandler: Function,
  vm: Component
) {
  let name, cur, old, event
  for (name in on) {
    cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    if (isUndef(cur)) {
      __DEV__ && warn('')
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm)
      }
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture)
      }
      add(event.name, cur, event.capture, event.passive, event.params)
    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
```

这里首先是遍历 **新事件定义对象**，并与之前的事件对象进行对象（**如果当前事件中没有定义该事件函数，则报错**）。

> 如果原事件 **没有定义**，则调用 **createFnInvoker()** 进行定义；但如果是一个 **.once** 修饰的事件，则会用 **createOnceHandler()** 重新定义该事件；最后将其添加到当前实例的 **$on** 属性中。

> 如果原事件中 **有事件定义，但与新定义事件对象地址不同**，则会将原事件定义的 函数定义部分 重新指向为当前新的事件定义，并赋值给新事件对象中即可。

最后，则是遍历原事件对象，将不存在与新事件对象中的事件去除（以事件名作为区分）

当然，在遍历之前还调用了 **normalizeEvent** 函数来格式化事件对象。

### 4. normalizeEvent 事件对象格式化

该函数定义十分简单，就是一个带缓存作用的字符串截断方法。

```typescript
const normalizeEvent = cached(
  (name: string): {
    name: string
    once: boolean
    capture: boolean
    passive: boolean
    handler?: Function
    params?: Array<any>
  } => {
    const passive = name.charAt(0) === '&'
    name = passive ? name.slice(1) : name
    const once = name.charAt(0) === '~'
    name = once ? name.slice(1) : name
    const capture = name.charAt(0) === '!'
    name = capture ? name.slice(1) : name
    return { name, once, capture, passive }
  }
)
```

这里其实就是根据 **@** 或者 **v-on:** 后的字符串，根据不同的定义来进行截断，返回一个包含 真实事件名、修饰符声明的对象。

### 5. createFnInvoker 创建事件调用

这个函数其实就是使用闭包方式返回一个调用函数 **invoker**，并添加 **invoker.fns** 属性，以 **数组形式** 保存这个事件名对应的所有事件。最后在调用 **invoker()** 时，内部会遍历 **invoker.fns** ，利用函数的 **apply** 方法改变指向为注册时的 Vue 实例并触发事件。