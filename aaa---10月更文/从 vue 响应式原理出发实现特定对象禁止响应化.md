---
highlight: an-old-hope
theme: hydrogen
---

持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第N天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

# 从 vue 响应式原理出发实现特定对象禁止响应化

## 开篇

总所周知，Vue 是一套用于构建用户见面的渐进式 MVVM 框架，对于初学者十分友好；Vue 在开发中充当了一个 VM（ViewModel）角色，内部使用 **数据双向绑定** 替我们完成了 V（View 视图）与 M（Model 模型，也指代逻辑部分）数据绑定和更新响应，整个 VM 部分也可以称为 **响应式系统**。数据响应式处理也是 Vue 最独特的特性之一。

但是，在实际的开发过程中，我们的有些数据并 **不希望它被响应化处理**，此时我们有哪些办法来避免在组件实例化和更新过程中被处理呢？

我们可以从 Vue 的响应式原理出发找到对应的解决办法。

> 什么时候会需要去阻止数据被响应化处理呢？
>
> 从个人以前的项目总结一下几种情况：
>
> 1. 高德地图相关实例、eCharts 图表实例 等实例上具有很多属性、且属性有可能存在嵌套等情况的时候一般不要响应化处理
> 2. Bpmn.js 相关的流程图元素实例，内部部分属性查找、更新等方法与 Vue 有冲突，容易导致程序执行出错
> 3. 嗯，，，就是不想被响应化处理的数据
>
> 📌 **Vue 3 内置了 markRaw 的方法来阻止响应式，后面会提到一点；这里主要讲 Vue 2**

## 1. Vue 响应式处理

>  在我的专栏 [Vue2 源码阅读理解](https://juejin.cn/column/7136858810605371399) 中，也更新了 Vue 2 的响应式原理部分，有兴趣的同学欢迎大家去阅读一下。

与其他文章讲的一样，Vue 的响应式系统就是通过 **数据劫持** 配合 **发布-订阅模式** 来实现的。

在 Vue 组件实例化的过程中，会将组件配置中的 data 返回的数据进行 Observer 处理，通过 Object.defineProperty 改变对象每个属性的 getter 与 setter，在后面实例化 watcher （computed 与 watch）与生成 VNode 时会对内部使用到的属性进行一次 getter 操作，收集相关依赖；在数据更新（也就是触发 setter 操作）时，会根据该属性收集到的对应的依赖去触发 watcher 的更新操作；最后会重新生成新的 VNode 更新视图。

从这个过程中可以发现，只要我们保证一个对象/属性在实例化时不被 Object.defineProperty 改变默认的 getter 和 setter 方法，那么就可以避免后面的一系列操作，从而实现数据阻止响应式了。

### 1.1 Observer

首先我们先看一下 Observer 相关的代码：

```javascript
class Observer {
  constractor(value, shallow, mock) {
    this.dep = new Dep();
    this.vmCount = 0;
    def(value, '__ob__', this);
    if (isArray(value)) {
      // ...
    }
    else {
      var keys = Object.keys(value);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        defineReactive(value, key, NO_INIITIAL_VALUE, undefined, shallow, mock);
      }
    }
  }
  observeArray(value) {
    for (var i = 0, l = value.length; i < l; i++) {
      observe(value[i], false, this.mock);
    }
  }
}

function observe(value, shallow, ssrMockReactivity) {
    if (!isObject(value) || isRef(value) || value instanceof VNode) {
        return;
    }
    var ob;
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__;
    }
    else if (shouldObserve &&
        (isArray(value) || isPlainObject(value)) &&
        Object.isExtensible(value) &&
        !value.__v_skip) {
        ob = new Observer(value, shallow, ssrMockReactivity);
    }
    return ob;
}

function defineReactive(obj, key, val, customSetter, shallow, mock) {
    var dep = new Dep();
    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
        return;
    }
    var getter = property && property.get;
    var setter = property && property.set;
    var childOb = !shallow && observe(val, false, mock);
  
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter() {
        var value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          // ...
        }
        return isRef(value) && !shallow ? value.value : value;
      },
      set: function reactiveSetter(newVal) {
        var value = getter ? getter.call(obj) : val;
        if (!hasChanged(value, newVal)) return;
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        childOb = !shallow && observe(newVal, false, mock);
        dep.notify();
      }
    });
    return dep;
}
```

### 1.2 initState

然后在实例初始化时，会调用 **initState** 初始化数据方法等：

```javascript
function initState(vm) {
  var opts = vm.$options;
  // ..
  if (opts.data) {
    initData(vm);
  } else {
    var ob = observe((vm._data = {}));
    ob && ob.vmCount++;
  }
  // ...
}
function initData(vm: Component) {
  let data: any = vm.$options.data
  data = vm._data = isFunction(data) ? getData(data, vm) : data || {}
  if (!isPlainObject(data)) {
    data = {}
  }
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  const ob = observe(data)
  ob && ob.vmCount++
}

export function isReserved(str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5f
}
```

### 1.3 响应式过程分析

> 在上面的代码中我省略了一部分其他的逻辑部分和数组的响应式处理，主要是因为数组的响应主要通过几个数组操作方法，本身与我们的需求不冲突；其他部分的省略则是因为与 Observer 的联系在本文中不算是重点。

在实例化过程中，**initState** 方法内部会通过调用 **observe** 方法去处理 data 中的数据，并且为了保证后面的逻辑可以正常执行（比如后面有 $set 等），不存在 data 配置项时会使用一个空对象来进行后续处理。

**1. observe**

observe 方法中，会先校验该数据是否已经被处理过（是否具有一个 `__ob__` 属性，且该属性是 Observer 的实例）；没有则进行后面的校验：

1. 闭包中的 **shouldObserve** 变量为 true
2. 是一个数组或者对象
3. 该对象或数组可以扩展属性
4. 对象或数组不具有 `__v_skip` 属性或者该属性为 false

校验通过则实例化一个新的 Observer 实例。

**2. new Observer**

这里会在上文 observe 的对象/数组 上添加一个 `__ob__` 属性，并把当前的 Observer 实例赋值到该属性上；然后对数组/对象进行区分处理：

- 数组：遍历调用 observe 处理内部的每个元素
- 对象：遍历属性调用 defineReactive 进行数据拦截

所以，最终的核心处理依然是在 **defineReactive** 方法中。

**3. defineReactive**

这时就是通过 **Object.defineProperty** 去修改原有的对象属性 getter、setter 方法，进行依赖收集；内部还会对该属性进行一次 observe 处理，如果该属性也是对象或者数组，还会进行内部的深度处理。

> 在 initData 时，还会校验 data 函数返回的对象的 key 是否符合规范（禁止以 `_`和 `$` 作为开头），合规才会进行 observe 处理。

## 2. 阻止响应式的方式

从上面的过程中，我们可以发现，只要在具有 **if** 判断的地方将条件设置为不满足情况，即可以中断后面的响应式处理操作。

汇总一下上面的判断逻辑，大致可以发现有这几个可以操作的地方：

1. 根据 initData 中的判断，将 data 函数返回的对象的属性 key 设置为以 `$` 或者 `_` 开头
2. 根据 observe 中的判断，将需要阻止响应式处理的对象添加一个 `__ob__` 的属性并设置为一个 Observer 实例
3. 根据 observe 中的判断，将需要阻止响应式处理的对象使用 **Object.freeze** 进行冻结，禁止扩展
4. 根据 observe 中的判断，将需要阻止响应式处理的对象添加一个 `__v_skip` 的属性并设置为 true

但是需要注意以下问题：

1. 在 data 返回对象中将属性 key 设置为以 `$` 或者 `_` 开头时，开发环境将抛出警告；并且在 template 中无法正常查找到该属性
2. 给对象添加  `__ob__` 的属性并设置为一个 Observer 实例，这个方法虽然可以，但是需要实例化一个 **Observer** 对象，不符合常规用法，也容易造成误解
3. 使用 Object.freeze 冻结对象，有可能不利于后面的操作

综上：**如果需要阻止一个对象/数组的响应式处理，建议设置一个属性`__v_skip` 且置为 true**

> 其实 Vue 2.7 增加的 markRaw 和 Vue 3 的 markRaw 方法代码都一样，也是将需要的对象添加一个 属性`__v_skip` 且置为 true；
>
> 📌Vue 2.7 之前的版本这里的关键字使用的是 `_isVue`，可以将该属性配置为 true 避免被响应式处理。

此时，我们可以编写一个 unObserve 的方法。

```javascript
import Vue from "vue"

const version = Vue.version.slice(1)

const versionNum = Number(version.split('.')[0] + version.split('.')[1])

function getRawType(value) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}
function unObserver(val) {
  if (getRawType(val) === "object" || getRawType(val) === "array") {
    if (versionNum >= 27) {
      val.__v_skip = true;
    } else {
      val._isVue = true;
    }
    
    return val;
  }
  return val;
}
```

对于需要阻止响应式的对象，可以这样声明：

```javascript
export default {
  name: "Demo",
  data() {
    return {
      data1: { a1: "data1", b: "b1" },
      data2: unObserve({ a1: "data2", b: "b2" })
    };
  }
};
```

此时改变 data2 中的数据，则不会触发视图更新和其他依赖，即使 watcher 和 computed 一样会无法响应。

## 3. 注意事项

虽然上面的方法可以避免数据被响应式处理，但是也需要注意这些问题：

1. 在方法中直接通过 **this.data2 = unObserve({a1: 'new data 2'})** 修改，相当于重新声明一个新的对象，会修改原本的引用地址，触发 data 函数中返回的整个大对象的属性 setter，此时依然会更新视图；而如果在 data 函数的 返回对象中直接设置一个属性 `__v_skip` 为true，则整个data中的数据改变都不会触发视图更新。
2. 将 unObserve 处理的对象通过 props 传递给子组件，一样只会在对象的引用地址发生改变时才会触发视图更新
3. 例如上文中的 data1 和 data2，优先修改 data2 后，过段时间再更新 data1，则视图更新时依旧会以最新的 data1、data2 进行计算
4. 数据也不一定需要都在 data 中声明，也可以在执行过程中直接通过 **this.xxx** 来定义一个属性/对象，保证在组件内部可以共享；但是需要注意在组件销毁时清空依赖关系

可能阻止响应式还会带来其他意想不到的问题，不过有些时候，避免复杂对象被处理，依然能带来一些性能方面的提升；另一方面也可以加深我们对 Vue 源码的理解。



### 往期精彩

[Bpmn.js 进阶指南](https://juejin.cn/column/6964382482007490590)

[Vue 2 源码阅读理解](https://juejin.cn/column/7136858810605371399)

[一行指令实现大屏元素分辨率适配(Vue)](https://juejin.cn/post/7148476639343542279)

[基于 Vue 2 与 高德地图 2.0 的“线面编辑器”](https://juejin.cn/post/7142746736690200612)

