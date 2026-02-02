## Inject/Provide 初始化

### 1. initInjections 依赖初始化

该步骤其实发生在 **initState** 之前，但是由于 **provide/inject** 一般是配合使用，所以这里调整了一下顺序。

该函数的定义与过程都比较简单：

```typescript
export function initInjections(vm: Component) {
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      if (__DEV__) {
        defineReactive(vm, key, result[key], () => warn(''))
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}
export function resolveInject(inject: any, vm: Component): Record<string, any> | undefined | null {
  if (inject) {
    const result = Object.create(null)
    const keys = hasSymbol ? Reflect.ownKeys(inject) : Object.keys(inject)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key === '__ob__') continue
      const provideKey = inject[key].from
      if (provideKey in vm._provided) {
        result[key] = vm._provided[provideKey]
      } else if ('default' in inject[key]) {
        const provideDefault = inject[key].default
        result[key] = isFunction(provideDefault) ? provideDefault.call(vm) : provideDefault
      } else if (__DEV__) {
        warn('')
      }
    }
    return result
  }
}
```

1. 在 **initInjections** 函数中，只是遍历了 **options.inject** 配置的依赖数据，并 **关闭** 了依赖数据的 响应式依赖收集，最后通过 **defineReactive** 将对应的数据挂载到实例 **vm** 上，以便后面能直接访问。

> 这就是官方提示的 **为什么 provide/inject 的数据不是响应式的了**。

2. 而 **resolveInject** 函数就是用来对组件的 **inject** 依赖数据进行处理，并返回一个没有多余原型链的对象。

**在官方文档中，inject 接收一个字符串数组或者一个 key 为 string 的对象，而作为对象时则 必须 有 from 字段来表示依赖数据的获取指向，另外也接收一个 default 属性作为降级时使用的默认值**。

> 但是，在 mergeOptions 之后，会将 options.inject 转为标准对象格式。
>
> **并且这里并没有对注入数据 provide[key] 进行处理，而是直接赋值；所以才有：如果你传入了一个可监听的对象，那么其对象的 property 还是可响应的。**

**resolveInject()** 函数就是解析标准格式 inject 配置，并将上层组件的 **provide** 的值或者 **default** 默认值绑定到函数返回对象中；如果这两个都没有，则会提示错误信息 “injection xx not found”

### 2. initProvide 注入数据初始化

初始化注入数据的过程也很简单，整个过程其实与 **initInjection** 类似。其函数定义如下：

```typescript
export function initProvide(vm: Component) {
  const provideOption = vm.$options.provide
  if (provideOption) {
    const provided = isFunction(provideOption) ? provideOption.call(vm) : provideOption
    if (!isObject(provided)) {
      return
    }
    const source = resolveProvided(vm)
    
    const keys = hasSymbol ? Reflect.ownKeys(provided) : Object.keys(provided)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      Object.defineProperty(
        source,
        key,
        Object.getOwnPropertyDescriptor(provided, key)!
      )
    }
  }
}
export function resolveProvided(vm: Component): Record<string, any> {
  const existing = vm._provided
  const parentProvides = vm.$parent && vm.$parent._provided
  if (parentProvides === existing) {
    return (vm._provided = Object.create(parentProvides))
  } else {
    return existing
  }
}
```

官方文档中对 **provide** 配置项的说明是，可以是一个对象或者一个返回对象的函数。

- 所以这里首先判断了 **options.provide** 的类型并获取到了结果，如果结果 **不是对象则会直接退出**。

- 然后，则是初始化 **provide** 的数据。

  此时会将当前实例的 **provided** 数据与父组件实例的 **provided** 进行比较，如果相同，则返回一个 **以父组件实例 provided 数据为原型创建的对象**，否则直接返回当前实例的 **provided** 数据。

  > 因为每一个实例都会进行与父组件实例的注入数据比较，所以才能多层级传递

- 最后，则是遍历 **provided** 对象，通过 **Object.defineProperty** 来处理数据获取。



### 总结

整个 **provide/inject** 的初始化过程都很清晰，只是通过少数校验和处理，将 **provide** 数据一层一层传递下去，直到 **inject** 依赖时读该改数据的值；并且因为在初始化时会关闭响应式处理部分，所以 **provide/inject** 的 **直接绑定数据** 才不支持响应式；但又因为 **没有对数据的进行深层次处理**，所以，原有的响应式数据才会继续触发整个响应式系统的改变。

