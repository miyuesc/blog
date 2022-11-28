---
highlight: an-old-hope
theme: hydrogen
---

持续创作，加速成长！这是我参与「掘金日新计划 · 10 月更文挑战」的第N天，[点击查看活动详情](https://juejin.cn/post/7147654075599978532)

# Bpmn.js 中文文档 之 Overlays

## 前言

在之前的文章 [Bpmn.js 进阶指南之Lint流程校验(四)自定义检验](https://juejin.cn/post/7148268233882566692) 中我大概提了一下 Bpmn.js 的规则校验模块在显示错误/警告信息的时候，是依赖了 Overlays 模块来显示的，并且说过后面会单独讲述一下这个模块；加上很久很久之前写过了 Bpmn.js 的中文文档（一）和（二），后面就断更了，也算是留下了一个大坑。这次就借更文的机会为每个模块的功能和 API 进行一个说明吧。

> 🚀作者也为Bpmn.js写了一些实例项目和types声明，有兴趣的同学可以查看这两个地址：[bpmn-process-designer](https://github.com/miyuesc/bpmn-process-designer)、[vite-vue-bpmn-process](https://github.com/moon-studio/vite-vue-bpmn-process)

## BpmnOverlays 功能与定义

该模块位于 Bpmn.js 的 **底层项目 Diagram.js** 中，目录为 **diagram-js/lib/features/overlays/Overlays.js**。主要功能就是 **提供给用户添加 dom 结构的覆盖物到流程元素上，并且在流程图缩放、移动等操作时调整定位。**

该模块依赖 **EventBus、Canvas、ElementRegistry** 三个模块，并且也 **接收 config 配置**。

> 其中 config 配置可以在 **new Modeler()** 时添加一个 **key 为 overlays 的对象属性** 来设置，该对象接收 **show 和 scale** 两个参数。

其构造函数定义如下：

```typescript
type OverlaysConfig = {
  show?: {
    minZoom?: number
    maxZoom?: number
  }
  scale?: boolean & {
    min?: number
    max?: number
  }
}

export default class Overlays extends ModuleConstructor {
  constructor(config: OverlaysConfig | undefined, eventBus: EventBus, canvas: Canvas, elementRegistry: ElementRegistry)
}
```

## 覆盖物的显示

那么在我们添加一个覆盖物后页面会变成什么样呢？

**以之前 BpmnLint 的校验信息为例，假设我们的流程校验失败显示错误信息时，整个编辑区域的 dom 结构如下：**

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dac4a934e637489e86583d83d103da87~tplv-k3u1fbpfcp-watermark.image?)

此时 **最外层的 div.bjs-container 和 div.djs-container 是由 Bpmn.js 和 Diagram.js 两个生成的编辑器区域，Bpmn.js 在 Diagram.js 的基础上进行了一次包装，添加了一个项目 Logo。**

内部的 **svg 元素**，则是我们 **流程相关的元素的根节点，所有流程元素绑定的 svg 标签都在内部。**

而 **div.djs-overlays** 就是我们的 **所有覆盖物显示的根节点了**，内部又 **按照不同的流程节点元素进行了分组，每个流程节点元素下又按照 “type 类型” 进行了二次分组，在里面才是真实的、我们添加的自定义覆盖物元素内容。**

## 可用方法

在之前的文章中，有提到过 Bpmn.js 内部的各个模块都是通过 **Injector 依赖注入** 来实现互相引用的，在生成的 Modeler 实例上有一个 **get 方法**，可以 **通过模块名获取模块实例**。

所以我们在使用时可以通过这种方式获取到 overlays 实例，在调用其提供的方法。

```javascript
const modeler = new Modeler({})
const overlays = modeler.get('overlays')

// 后面就可以执行相关的方法了
overlays.xxx()
```

那么 BpmnOverlays 提供了哪些方法呢？

### 1. add 覆盖物添加方法

方法定义：

```typescript
class Overlays {
	add(element: Base, type: string | Overlay, overlay?: Overlay): string
}
```

> 这写方法都涉及到一些前置参数定义，这里统一说明：
>
> ```typescript
> export type Search = {
>   id?: string
>   element?: Base | string
>   type?: string
> }
> export type Overlay = {
>   html: string | HTMLElement
>   show?: {
>     minZoom?: number
>     maxZoom?: number
>   }
>   position?: {
>     left?: number
>     top?: number
>     bottom?: number
>     right?: number
>   }
>   scale?: boolean & {
>     min?: number
>     max?: number
>   }
> }
> export type Container = {
>   html: Element
>   element: Base
>   overlays: Overlay[]
> }
> ```
>
> 其中 **Base** 是 Bpmn.js 中的 **元素实例基础类**

**add** 方法作为 **添加覆盖物元素到目标流程元素** 上的方法，接收三个参数，其中第二个参数为可选参数：

- element：需要添加覆盖物元素的目标流程元素
- type：用来定义这个覆盖物的类型，如果传递改参数，会 **将所有 type 一致的覆盖物元素进行分组**
- overlay：具体的覆盖物配置，**必传参数为 覆盖物 html 字符串**，其他的 **show 用来表示最大、最小可见缩放范围，scale 表示覆盖物跟随流程图缩放时的最大、最小缩放倍数**

**在 add 执行成功后会返回一个该覆盖物对应的 id 字符串**

例如 **bpmnLint** 中添加错误信息时，就是通过这个方法添加的：

```javascript
var $html = minDom.domify(
  '<div class="bjsl-overlay bjsl-issues-' + menuPosition + '"></div>'
);
// ... 一系列错误信息的组合操作
this._overlays.add(element, 'linting', {
  position: position,
  html: $html,
  scale: {
    min: .9
  }
});
```

> this._overlays 就是 BpmnOverlays 模块的实例，只是在校验模块的内部声明了一个变量来代理。

### 2. remove 覆盖物移除方法

有添加自然也有移除，在不需要覆盖物的时候就可以通过调用 remove 来移除掉某个覆盖物元素。

方法定义：

```typescript
class Overlays {
	remove(filter: string | Search): void
}
```

这个方法的效果就很简单啦，就是 **按照参数要求移除掉对应的覆盖物元素**。

如果参数是一个字符串时，则默认 **查找并移除覆盖物 id 等于该字符串的覆盖物**，否则就一一匹配并移除。

### 3. get 覆盖物查找

这个方法接收的参数与 **remove** 一致，因为 remove 就是通过这个方法来查找要移除的覆盖物元素的啦。

**返回值就是一个由覆盖物（types：Overlay）组成的数组，没有查找到则是一个空数组**。

```typescript
class Overlays {
  get(search: Search): Overlay | Overlay[] | null
}
```

### 4. show 显示/hide 隐藏

这两个方法就很好理解了，就是单纯的字面意思：**显示或隐藏所有的覆盖物元素，注意，是所有的。**

```typescript
class Overlays {
  show(): void
  hide(): void
}
```

> 这个方法是处理的最外层的 **div.djs-overlays** 的 **display 属性**，类似 Vue 的 **v-show**，所以需要注意内部某个元素的显示状态。

### 5. clear 清空覆盖物

这个方法会清除掉最外层的 **div.djs-overlays** 的 **所有子元素**，所以使用时也需要注意。

```typescript
class Overlays {
  clear(): void
}
```

同样的，这个方法也不接收参数，也没有返回值。

## 完整定义

```typescript
export default class Overlays extends ModuleConstructor {
  constructor(config: any, eventBus: EventBus, canvas: Canvas, elementRegistry: ElementRegistry)
  _eventBus: EventBus
  _canvas: Canvas
  _elementRegistry: ElementRegistry
  _overlayDefaults: Overlay
  _overlays: Record<string, Overlay | Overlay[]>
  _overlayContainers: Container[]
  _overlayRoot: Element
  _ids: IdGenerator

  get(search: Search): Overlay | Overlay[] | null
  add(element: Base, type: string, overlay: Overlay): string
  remove(filter: string | Object): void
  show(): void
  hide(): void
  clear(): void

  _updateOverlayContainer(container: Container): void
  _updateOverlay(overlay: Overlay): void
  _createOverlayContainer(element: Base): Container
  _updateRoot(viewbox: Viewbox): void
  _getOverlayContainer(element: Base, raw?: boolean): Container
  _addOverlay(overlay: Overlay): void
  _updateOverlayVisibilty(overlay: Overlay, viewbox: Viewbox): void
  _updateOverlayScale(overlay: Overlay, viewbox: Viewbox): void
  _updateOverlaysVisibilty(viewbox: Viewbox): void
}
```

本身这个模块除了上面暴露的六个基础方法之外，还有一系列的 **私有方法（当然也只是命名上的私有，还是可以使用的）**，用来拆分六个基础方法之中的一些处理逻辑。

这里这些私有方法和属性的定义就留给大家去研究啦。

本身在项目中 Bpmn.js 也很少使用其他模块的私有方法，也是值得我们学习的一点吧。做好对业务逻辑的拆分，也更加容易理解和修改原有代码。

