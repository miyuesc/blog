# Vue 2 阅读理解（一）

## 1. 简介

> Vue 是什么？
> 
>一个 用于构建用户界面 **渐进式** 的 **MVVM** **框架**。

Vue 与 React、Angular 组成前端三大框架，Vue 是三者中开源最晚的框架，内部也借鉴了不少 React 和 Angular 的优秀思想。

但是，Vue 作为后者，也在其他两个框架的基础上做了一些优化和改变：

1. 与 React 一样使用 Virtual DOM，但是优化了组件更新渲染，而不会在组件更新时重新渲染整个组件树
2. 与 React 一样划分核心库与扩展功能库（路由等），但是由官方维护核心扩展功能库，保证相关依赖的及时性和准确性
3. 同时使用 JSX 与 Template 模板语法，可以根据不同的组件类型来使用不同的开发方式，并且模板语法更加利于新手使用，部分语法也更加简洁
4. React 采用 CSS-in-JS 的方式处理组件样式，而 Vue 则直接通过 SFC 将样式打包到组件当中
5. Vue 采用与 React 相似的单向数据流处理方式，比 Angular 的双向数据流更加直观且易于理解
6. Vue 采用异步依赖收集配合观察者模式触发组件/数据更新，而非使用 AngularJS 的脏值检测，减少了 Watcher 计算次数，优化运行时性能
7. TypeScript 支持，但是 Vue 2 的 TS 支持采用的是装饰器模式来声明组件，并对官方库提供类型声明，但是体验不如其他两个库友好

## 2. Vue 构造函数

Vue 构造函数的核心内容都在 **src/core** 目录中，在 **core/index.ts** 入口文件内，导出的就是完整的 Vue 构造函数。这里省略掉服务端部分。

```typescript
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'

initGlobalAPI(Vue)

export default Vue
```

这里可以从命名上大致看出来，负责实例化的部分（也就是创建 Vue 实例并提供实例方法的部分，主要配置 **Vue.prototype**）在 **src/core/instance** 下，而 **initGlobalAPI** 主要是在 **Vue** 构造函数上增加部分公共方法和属性，可以通过 **Vue.xxx** 直接使用而不关实例。

**src/core/instance/index.ts** 则包含以下部分：

1.  **function Vue** ：创建 Vue 构造函数
2.  **initMixin(Vue)**：定义 **_init** 方法，为实例添加一些标识字段并合并组件配置项，之后初始化生命周期、事件、渲染函数并触发 **beforeCreate**；之后依次初始化 inject、props、methods、data、computed、watch，最后触发 **created** 并调用 **$mount** 方法挂载实例
3.  **stateMixin(Vue)**：定义组件数据的处理方法，并声明禁止修改 props；然后在原型上添加 **$set**, **$delete** 和 **$watch** 方法
4.  **eventsMixin(Vue)**：定义组件间的事件处理方法，包括 **$on**，**$off** 等，并且会判断有没有生命周期监听，将监听方法保存到实例的 **_events** 对象中
5.  **lifecycleMixin(Vue)**：定义 **_update**，**$forceUpdate**，**$destroy** 方法和一些实例属性，并触发对应的生命周期钩子函数
6.  **renderMixin(Vue)**：定义一系列与解析和渲染相关的方法，并添加 **$nextTick** 和 **_render** 方法

**src/core/global-api/index.ts** 主要是声明全局方法：

1. **Vue.config**：全局参数/配置项
2. **Vue.util**：工具函数，包含 **warn，extend，mergeOptions，defineReactive**
3. **Vue.set**：设置对象的某个属性值并触发更新，与 **Vue.prototype.$set** 一致
4. **Vue.delete**：删除对象的某个属性值并触发更新，与 **Vue.prototype.$delete** 一致
5. **Vue.nextTick**：设置组件更新之后的回调函数，与 **Vue.prototype.$nextTick** 一致
6. **Vue.observable**：手动设置某个值为响应式数据
7. **Vue.options**：这里则是包含 'component', 'directive', 'filter' 等基础配置，没有对外暴露
8. **Vue.use**：调用插件的 **install** 方法安装插件
9. **Vue.mixin**：全局混入
10. **Vue.extend**：构造一个具有配置项的子类
11. **Vue.component, Vue.directive, Vue.filter**：注册全局组件、指令、过滤器

> 上面的 Vue 构造函数定义还缺少最重要的 **$mount** 挂载方法（initMixin(Vue)）处有使用。

**$mount** 函数



