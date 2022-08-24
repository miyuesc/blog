## initState 状态初始化

在配置标准化合并以及声明周期初始化完成之后，会调用 **callHook('beforeCreate')** 来表示组件已进入正式实例化阶段。

这个时候会对数据、方法、监听器等配置项进行对应的处理，并且在开发环境还会进行一系列校验，抛出校验异常信息。整个数据的初始化过程是 **initInjection => initState => initProvide**，但是 **injection/provide** 一般是一起使用，所以这里也替换一下顺序，将这两者放到后面一起分析。

首先是 **initState** 的函数定义：

```typescript
export function initState(vm: Component) {
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)

  // Composition API
  initSetup(vm)

  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    const ob = observe((vm._data = {}))
    ob && ob.vmCount++
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

整个过程其实十分清晰：

1. **initProps**：初始化 **props** 组件参数配置
2. **initSetup**：解析 **setup** 配置，处理 **setup** 的返回值（这里主要是 2.7 版本之后为了适配 v3 语法新增的内容）
3. **initMethods**：初始化组件方法
4. **initData**：初始化组件内变量
5. **initComputed**：初始化组件计算属性
6. **initWatch**：初始化组件内部监听器

### 1. initProps

该函数定义如下：

```typescript
function initProps(vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = (vm._props = shallowReactive({}))
  const keys: string[] = (vm.$options._propKeys = [])
  const isRoot = !vm.$parent
  
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    if (__DEV__) {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) || config.isReservedAttr(hyphenatedKey)) {
        warn('')
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn('')
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}
```

这个过程会遍历整个组件的 **props** 配置项（mergeOptions 之后，已包含继承和混入），并将每个 **prop key** 从驼峰形式转换为 **-** 短横线连接的形式。

> 这也是为什么官方推荐 **props** 配置使用 **小写驼峰**，而组件使用时绑定参数使用 **- 短横线** 的原因。

之后，则是校验每个 **prop** 的 **key** 是否符合规范（即不是 Vue 的内置关键字 ref，key 等，也是不是配置里面 **isReservedAttr(key)** 禁止的属性名）；最后，通过 **defineReactive** 来对 **prop** 进行响应式处理，并挂载到 **vm._props** 中。

> 当然，上面的响应式处理 **只针对根组件**，如果不是根组件的话，是会在函数前面部分调用 **toggleObserving(false)** 来关闭响应式处理

### 2. initSetup

这个部分是为了适配 v3 语法新增的一部分，这里就不放源码，只简单介绍一下。

该方法位于 **src/v3/apiSetup.ts** 文件内，在执行过程中，主要有以下几步：

1. 通过 **createSetupContext(vm)** 创建一个 **setup** 函数执行过程中的上下文对象，该对象包括 **attrs，listeners，slots，emit** 几个属性，以及一个 **expose** 方法；然后将这个上下文对象绑定到组件的 **_setupContext** 属性上，最后调用 **setCurrentInstance** 将当前上下文实例指定为当前组件实例 **vm**
2. 调用 **pushTarget()** 阻止过程中的依赖收集，并调用 **invokeWithErrorHandling** 来获取 **setup** 函数的返回值
3. 然后删除 **setup** 中的当前实例上下文，调用 **popTarget** 恢复依赖收集
4. 判断 **setup** 函数的执行返回值，如果是函数，则说明返回的是 **render**，将该返回值赋值给 **options** 用于后面执行 **mount** 渲染；如果是对象，则会将返回值赋值给 **vm._setupState**，然后遍历返回值对象，进行响应式处理

### 3. initMethods

函数定义如下：

```typescript
function initMethods(vm: Component, methods: Object) {
  const props = vm.$options.props
  for (const key in methods) {
    if (__DEV__) {
      if (typeof methods[key] !== 'function') {
        warn('')
      }
      if (props && hasOwn(props, key)) {
        warn('')
      }
      if (key in vm && isReserved(key)) {
        warn('')
      }
    }
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}
```

这部分就十分十分简单了，就是通过 **Function.bind** 函数来更改组件配置 **options** 中的每一个方法的 this 指向，最后重新绑定到当前组件上。

> 这里的校验其实就是校验名字是否会和 js 的内置方法名冲突，或者与 props 中存在同名方法。

### 4. initData

在执行 **initData** 之前，会校验 **options** 中有没有 data 配置，没有则会初始化为一个空对象。其函数定义如下：

```typescript
function initData(vm: Component) {
  let data: any = vm.$options.data
  data = vm._data = isFunction(data) ? getData(data, vm) : data || {}
  if (!isPlainObject(data)) {
    data = {}
    __DEV__ && warn('')
  }
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (__DEV__) {
      if (methods && hasOwn(methods, key)) {
        warn('')
      }
    }
    if (props && hasOwn(props, key)) {
      __DEV__ && warn()
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  const ob = observe(data)
  ob && ob.vmCount++
}
```

这里其实也比较简单，就是校验是否有与 props 或者 methods 同名的数据，并将其代理到 **vm._data** 上，最后通过 **observe** 方法对数据进行响应式处理。

### 5. initComputed 与 initWatch

这两部分主要是配置对 **data** 与 **props** 的变量的 **变化侦测（监听）**，因为涉及到 Vue 的响应式系统中的 **Watcher** 观察者定义 与 依赖收集系统，整体的内容比较多，所以后面整体讲。

简单分析两者的基本逻辑：

**initComputed：**

1. 获取 **options.computed** 里定义的每个计算属性的 **get** 方法作为 **getter**（如果就是一个函数，则这个函数直接作为 getter）
2. 如果该计算属性的 key **不能在当前的实例上找到**，则直接通过 **defineComputed** 定义一个计算属性
3. 如果能找到，则判断是否是在 **data，methods，props** 中，并报出对应错误

**initWatch：**

这个过程则更加简单，因为不用校验 key 的重复性，所以会直接遍历 **options.watch**，如果某个属性的监听器有两个 handler 方法，还会将方法提出来，最后调用 **createWatcher** 来创建监听器。