---
highlight: an-old-hope
theme: hydrogen
---

持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第N天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

# 手把手教你使用Vue3指定状态管理库--Pinia

## 前言

在 2020 年 9 月 Vue 3 发布正式版本之后，2021 年 2 月 Vuex 也发布了适配 Vue 3 的 **4.0** 版本，但是在 2021 年 8 月底，由 Vue 核心团队成员 Eduardo 主要贡献的全新 Vue 状态共享库发布 **2.0** 版本，并在同年 11 月，尤大正式指定 Pinia 为 Vue 的官方状态库（现在 Vue 官网也已经将 Vuex 替换为了 Pinia）。

## 什么是 Pinia

Pinia 与 Vuex 一样，是作为 Vue 的“**状态存储库**”，用来实现 **跨页面/组件** 形式的数据状态共享。

在平时的开发过程中，Vue 组件之间可以通过 **Props** 和 **Events** 实现组件之间的消息传递，对于跨层级的组件也可以通过 **EventBus** 来实现通信。但是在大型项目中，通常需要在浏览器 **保存多种数据和状态**，而使用 **Props/Events** 或者 **EventBus** 是很难维护和扩展的。所以才有了 Vuex 和 Pinia。

## Pinia 为何能取代 Vuex

作为 Vue 开发者都知道，Vuex 作为 Vue 的老牌官方状态库，已经和 Vue 一起存在了很长时间，为什么现在会被 Pinia 取代呢？

官方的说法主要是以下几点：

1. 取消 **mutations**。因为在大部分开发者眼中，mutations 只支持 **同步修改状态数据**，而 **actions** 虽然支持 **异步**，却依然要在内部调用 mutations 去修改状态，无疑是非常繁琐和多余的
2. 所有的代码都是 TypeScript 编写的，并且所有接口都尽可能的利用了 TypeScript 的 **类型推断**，而不像 Vuex 一样需要自定义 TS 的包装器来实现对 TypeScript 的支持
3. **不像 Vuex 一样需要在实例/Vue原型上注入状态依赖，而是通过直接引入状态模块、调用 getter/actions 函数来完成状态的更新获取**；并且因为自身对 TypeScript 的良好支持和类型推断，开发者可以享受很优秀的代码提示
4. **不需要预先注册状态数据**，默认情况下都是根据代码逻辑自动处理的；并且可以在使用中随时注册新的状态
5. **没有 Vuex 的 modules 嵌套结构，所有状态都是扁平化管理的**。也可以理解为 pinia 注册的状态都类似 vuex 的 module，只是 pinia 不需要统一的入口来注册所有状态模块
6. 虽然是扁平化的结构，但是依然支持 **每个状态之间的互相引用和嵌套**
7. 不需要 namespace 命名空间，得利于扁平化结构，每个状态在注册时即使没有声明状态模块名称，pinia 也会默认对它进行处理

> 总结一下就是：**Pinia 在实现 Vuex 全局状态共享的功能前提下，改善了状态存储结构，优化了使用方式，简化了 API 设计与规范；并且基于 TypeScript 的类型推断，为开发者提供了良好的 TypeScript 支持与代码提示。**

## 如何使用

>  至于 Pinia 在项目中的安装，大家应该都知道，直接通过包管理工具安装即可。

### 1. 注册 Pinia 实例

以 Vue 3 项目为例，只需要在入口文件 **main.ts** 中引入即可完成 Pinia 的注册。

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
```

> 当然，因为支持 createApp 支持 **链式调用**，所以也可以直接写成 **`createApp(App).use(createPinia()).mount('#app')`**.

此时 **createPinia()** 创建的是一个根实例，在 **app.use** 的时候会在 app 中注入该实例，并且配置一个 **app.config.globalProperties.$pinia** 也指向该实例。

### 2. 定义状态 Store

在注册一个 Pinia 状态模块的时候，可以通过 **defineStore** 方法创建一个 **状态模块函数**（之所以是函数，是因为后面调用的时候需要通过函数的形式获取到里面的状态）。

deineStore 函数的 TypeScript 定义如下：

```typescript
function defineStore<Id, S, G, A>(id, options): StoreDefinition<Id, S, G, A>
function defineStore<Id, S, G, A>(options): StoreDefinition<Id, S, G, A>
function defineStore<Id, SS>(id, storeSetup, options?): StoreDefinition<Id, _ExtractStateFromSetupStore<SS>, _ExtractGettersFromSetupStore<SS>, _ExtractActionsFromSetupStore<SS>>

type Id = ID extends string
type storeSetup = () => SS
type options = Omit<DefineStoreOptions<Id, S, G, A>, "id"> | DefineStoreOptions<Id, S, G, A> | DefineSetupStoreOptions<Id, _ExtractStateFromSetupStore<SS>, _ExtractGettersFromSetupStore<SS>, _ExtractActionsFromSetupStore<SS>>
```

可以看到该函数最多接收 **3个参数**，但是我们最常用的一般都是第一种或者第二种方式。这里以 **第一种方式** 例，创建一个状态模块函数：

```typescript
// 该部分节选字我的开源项目 vite-vue-bpmn-process
import { defineStore } from 'pinia'
import { defaultSettings } from '@/config'
import { EditorSettings } from 'types/editor/settings'

const state = {
  editorSettings: defaultSettings
}

export default defineStore('editor', {
  state: () => state,
  getters: {
    getProcessDef: (state) => ({
      processName: state.editorSettings.processName,
      processId: state.editorSettings.processId
    }),
    getProcessEngine: (state) => state.editorSettings.processEngine,
    getEditorConfig: (state) => state.editorSettings
  },
  actions: {
    updateConfiguration(conf: Partial<EditorSettings>) {
      this.editorSettings = { ...this.editorSettings, ...conf }
    }
  }
})
```

其中的 **options** 配置项包含三个部分：

- **state**：状态的初始值，推荐使用的是一个 **箭头函数**，方便进行类型推断
- **getters**：状态的获取，是一个对象格式；推荐配置为每个 getters 的对象属性为 **箭头函数**，方便进行类型推断；在使用时等同于获取该函数处理后的 state 状态结果；**并且与 Vue 的计算属性一样，该方法也是惰性的，具有缓存效果**
- **actions**：类似 Vue 中的 methods 配置项，**支持异步操作**，主要作用是 **处理业务逻辑并更新状态数据**；另外，此时的 actions 是一个 **函数集合对象**，与 getters 不同的是 **不建议使用箭头函数**。**并且函数内部的 this 就指向当前 store 的 state。**

> 注意：getters 的函数定义中 **第一个参数就是当前 store 的状态数据 state**，而 actions 中的函数参数为 **实际调用时传递的参数，可以传递多个**，内部通过 **this 上下文** 直接访问 state 并进行更新。

### 3. 组件使用（配合 setup）

众所周知，vue 3 最大的亮点之一就是 **组合式API（Composition API）**，所以我们先以组件配合 setup 使用。

```typescript
import { defineComponent, ref } from 'vue'
import { EditorSettings } from 'types/editor/settings'
import editorStore from '@/store/editor'

export default defineComponent({
  setup(props) {
    const editor = editorStore()

    // getter
    const prefix = editor.getProcessEngine
    
    // 更新，调用 actions
    editorStore.updateConfiguration({})

    return {
      editorStore
    }
  }
})
```

## 最后

总的来说，Pinia 作为 Vue 官方推荐的状态库，配合 Vue 3 的组合式 API，可以更好的实现项目中各种数据状态的管理，而不是像以前使用 Vuex 一样通过 modules 的形式注册各种状态。Pinia 对于抽离逻辑进行复用（hooks），简化使用方式来说，比之前的 Vuex 好了很多倍；加上良好的类型支持与代码提示，让我们在开发过程中可以省去很多前置工作，也是对我们的开发效率的一种提升吧。

当然，、Vue DevTools 在更新之后，也实现了对 Pinia 的支持。

## 往期精彩

[Bpmn.js 进阶指南](https://juejin.cn/column/6964382482007490590)

[Vue 2 源码阅读理解](https://juejin.cn/column/7136858810605371399)

[一行指令实现大屏元素分辨率适配(Vue)](https://juejin.cn/post/7148476639343542279)

[基于 Vue 2 与 高德地图 2.0 的“线面编辑器”](https://juejin.cn/post/7142746736690200612)