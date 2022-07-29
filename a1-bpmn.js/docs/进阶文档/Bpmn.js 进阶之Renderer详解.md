---
theme: nico
highlight: a11y-dark
---

携手创作，共同成长！这是我参与「掘金日新计划 · 8 月更文挑战」的第3天，[点击查看活动详情](https://juejin.cn/post/7123120819437322247 "https://juejin.cn/post/7123120819437322247")

## 前言

继上次的 [Bpmn.js 进阶指南（万字长文）](https://juejin.cn/post/7117481147277246500) 之后，我相信大家对 Bpmn.js 的使用和自定义方法都有了一定的了解。但是因为有小伙伴反应文章太长，导致大家看完需要很长时间，正好配合 8月的更文活动，以后都在每篇文章中单独讲解一到三个小内容。

-----

🚀🚀现在开始第 13 小节，对 `Renderer` 元素渲染部分的解析和修改。

## 1. 源码解析

整个 `Renderer` 渲染部分，大致包括 `diagram.js/ElementFactory`, `diagram.js/GraphicsFactory`,  `diagram.js/BaseRenderer`, `diagram.js/Styles`, `bpmn.js/BpmnRenderer`, `bpmn.js/PathMap`, `bpmn.js/TextRenderer`, `bpmn.js/BpmnFactory`, `bpmn.js/ElementFactory` 这些模块。

这里对这几个部分的功能大致描述一下：

1. `diagram.js/ElementFactory`: 最底层元素实例创建工厂，根据 `diagram.js/model` 内定义的四种实例类型（`Root`, `Label`, `Shape`, `Connection`）创建对应的元素实例
2. `diagram.js/GraphicsFactory`: 创建元素实例对应的 SVG 分组元素，除 `Root` 类型实例外，其他元素都创建一个 `g.djs-group` 的 SVG 元素分组，然后根据剩下的三种实例类型，在该分组下创建对应（以 `Shape` 为例）的 `g.djs-element djs-shape` 分组元素（第二个类名就是 <code>`djs-${type}`</code>）; 之后通过 `Renderer` 函数将元素实例对应的 SVG 插入到该分组下
3. `diagram.js/BaseRenderer`: 最底层的元素节点 `Renderer` 模块，**不能直接使用**。在实例化时注册 `[ 'render.shape', 'render.connection' ]` 事件监听函数以创建元素实例对应的 SVG 元素，注册 `[ 'render.getShapePath', 'render.getConnectionPath' ]` 用来获取元素实例对应的 SVG 元素路径。并要求继承者实现创建 SVG 元素和获取 SVG 路径的四个方法：`drawShape`, `drawConnection`, `getShapePath`, `getConnectionPath`；以及判断是否可以绘制 SVG 元素的方法 `canRender`
4. `diagram.js/Styles`: 用来管理元素样式的模块，具有默认配置，但是不接受通过 `config` 传递自定义配置。默认提供三个方法：

   - `style`: 接受一个固定参数 `additionalAttrs` 和一个可选参数 `traits`，计算得到一个 SVG 元素的属性对象
   - `cls`: 比 `style` 方法多接受一个固定参数 `className`，得到一个包含 `class` 定义的 SVG 元素的属性对象
   - `computeStyle`: 接受一个 `custom` 自定义属性对象，跟默认配置合并后返回一个 SVG 元素的属性对象
5. `bpmn.js/BpmnRenderer`: `bpmn.js` 核心模块之一，提供多个 `handler` 元素创建方法，根据 `bpmn.json` 中定义的所有元素类型来调用对应的 `handler` 方法创建 SVG 元素。因为 `bpmn.js` 中将 `Connection` 连线元素也作为一种 `Shape` 图形，所以只实现了 `drawShape`, `drawConnection`, `getShapePath` 和 `canRender` 方法
6. `bpmn.js/PathMap`: 包含了所有的复杂元素的路径 `path`，并提供 `getRawPath` 和 `getScaledPath` 来获取某个图形对应的路径和缩放后的路径
7. `bpmn.js/TextRenderer`: 文字标签绘制模块，用来创建 SVG 文本标签以及计算文本标签大小等等
8. `bpmn.js/BpmnFactory`: 用来创建 `BPMN` 业务流程实例以及对应的 `BPMNDI` 实例
9. `bpmn.js/ElementFactory`: 继承 `diagram.js/ElementFactory`
   - 使用 `baseCreate` 来重新定义 `diagram.js/ElementFactory.prototype.create` 指向；
   - 重新定义 `create` 方法来区分 `label` 元素和其他元素的实例化；
   - 增加 `createBpmnElement` 扩展本身的 `create` 方法，用来实现 `BPMN` 业务实例的业务属性 `businessObject` 以及元素大小（`getDefaultSize`），并且通过 `bpmn.js/BpmnFactory` 来创建业务元素实例对应的 `DI` 实例，并挂载到 `businessObject.di` 属性上。
   - 增加 `getDefaultSize` 来根据元素类型区分元素大小
   - 增加 `createParticipantShape` 来创建泳道图形

以 `Palette` 创建一个新元素来拆分整个实例和 SVG 元素创建的过程：

1. 首先，调用 `elementFactory.createShape` 来创建一个元素实例，执行 `createShape => create => createBpmnElement => baseCreate`
2. 调用 `create.start` 开始拖拽创建过程，调用 `dragging.init`。
3. 在拖拽结束后，触发 `create.end`，并调用 `modeling.createElements` 创建对应的元素。
4. `modeling.createElements` 内部区分 `Shape` 和 `Connection` 来调用 `modeling.createShape` 或者 `modeling.createConnection`
5. `modeling[createShape|createConnection]` 都会调用 `canvas[addShape|addConnection]`, 最终都调用 `canvas._addElement`, 这里就会触发 `[shape|connection].add` 和 `[shape|connection].added` 事件，并调用 `graphicsFactory.create` 来创建元素的外层分组元素，并注册到 `elementRegistry` 中，最后调用 `graphicsFactory.update` 来触发真正的 SVG 元素绘制过程
6. 在 `graphicsFactory.update` 方法内部就是通过 `eventBus` 模块触发 `render.shape` 事件，来通过 `Renderer` 模块绘制 SVG

> 🚀🚀 元素最终的显示效果都是在 `Renderer` 过程中实现的，所以直接更改这个过程中或者这个过程之前的某些方法来实现自定义渲染。

## 2. 难度1：更改元素大小

在第一小节中可以知道，修改元素显示效果必须在 `Renderer` 过程中或者 `Renderer` 前进行调整。

这里提供两个比较简单的方法：

### 2.1 继承 `BaseRenderer` 重写 `drawShape` 方法来控制元素大小。

这一步主要是修改 `element` 实例的 `width` 和 `height` 属性，当然这一步也可以进行扩展，接受一个 `config` 配置项来动态修改。

```typescript
/* 1. 直接在 drawShape 中修改 */
class RewriteRendererProvider extends BaseRenderer {
   constructor(config, eventBus, styles, pathMap, canvas, textRenderer) {
      super(config, eventBus, styles, pathMap, canvas, textRenderer, 3000)
   }
   public drawShape(parentGfx: SVGElement, element: Shape): SVGRectElement {
      const type = element.type
      // 修改元素大小（可以根据类型来实现重新定义）
      element.width = 400
      element.height = 400
      const h = this._renderer(type)
      return <SVGRectElement>h(parentGfx, element)
   }
}

/* 2. 接受 config 配置项修改（可以通过修改 new Modeler 时的配置动态更改） */
class RewriteRendererProvider extends BaseRenderer {
   constructor(config, eventBus, styles, pathMap, canvas, textRenderer) {
      super(config, eventBus, styles, pathMap, canvas, textRenderer, 3000)
      this._config = config
   }
   public drawShape(parentGfx: SVGElement, element: Shape): SVGRectElement {
      const type = element.type
      // 修改元素大小（可以根据类型来实现重新定义）
      if (this._config.size) {
         const size = this._config.size[type]
         if (size) {
            element.width = size.width
            element.height = size.height
         }
      }
      const h = this._renderer(type)
      return <SVGRectElement>h(parentGfx, element)
   }
}

// 导出
RewriteRendererProvider.$inject = [
   'config.bpmnRenderer',
   'eventBus',
   'styles',
   'pathMap',
   'canvas',
   'textRenderer',
   'elementRegistry',
   'interactionEvents'
]
export default RewriteRendererProvider
```

### 2.2 继承 `bpmn.js/ElementFactory` 重写 `getDefaultSize` 方法

个人觉得这种方式修改比较符合开闭原则，也更加优雅。

这里笔者添加了一个 `config` 配置项来设置元素默认大小

```typescript
type ElementConfig = Record<string, Dimensions>

class CustomElementFactory extends ElementFactory {
  _config: ElementConfig | undefined
  constructor(
    config: Record<string, Dimensions>,
    bpmnFactory: BpmnFactory,
    moddle: BpmnModdle,
    translate: Translate
  ) {
    super(bpmnFactory, moddle, translate)
    this._config = config
  }

  getDefaultSize(element, di) {
    const bo = getBusinessObject(element)
    const types: string[] = Object.keys(this._config || {})
    for (const type of types) {
      if (is(bo, type)) {
        return this._config![type]
      }
    }
    return super.getDefaultSize(element, di)
  }
}

CustomElementFactory.$inject = ['config.elementFactory', 'bpmnFactory', 'moddle', 'translate']
ElementFactory.$inject = ['bpmnFactory', 'moddle', 'translate']

export default CustomElementFactory
```

这种方式可以在实例化的时候直接配置

```typescript
const modeler = new Modeler({
   container: 'xxx',
   elementFactory: {
      'bpmn:Task': { width: 120, height: 120 },
      'bpmn:SequenceFlow': { width: 100, height: 80 }
   }
})
```

## 3. 难度2: 改变某几个节点渲染

这一步也有两种方式，虽然原理差不多，但是对以后的代码阅读会有影响。

### 3.1 继承 `BpmnRenderer` 重写 `drawShape`

这种方式与上面的修改元素大小有点类似，只是需要在该方法内部判断需要修改的元素类型来重新调用 `SVGcreate` 来创建 `SVG` 元素

这种方式可以参见 [Bpmn.js 进阶指南（万字长文）](https://juejin.cn/post/7117481147277246500) 的 7.1 小节

### 3.2 继承 `BpmnRenderer` 重写 `handlers`

在 `drawShape` 方法中，可以看到最终是调用 `this._renderer(type)` 来实现，而 `this._renderer(type)` 返回的就是 `this.handlers[type]()` 的结果。

所以我们可以替换 `this.handlers` 中的某个类型的 `handler` 方法来实现自定义渲染。或者扩展自定义类型的渲染方法。

```typescript
class RewriteRendererProvider extends BaseRenderer {
   constructor() {
      super();
      function sqlRender (parentGfx, element, attr) {
         // 渲染外层边框
         const attrs = {
            fill: getFillColor(element, defaultFillColor),
            fillOpacity: defaultTaskOpacity,
            stroke: getStrokeColor(element, defaultTaskColor)
         }
         handlers['bpmn:Activity'](parentGfx, element, attrs)
         // 自定义节点
         const customIcon = svgCreate('image')
         svgAttr(customIcon, {
            ...(attr || {}),
            width: element.width,
            height: element.height,
            href: './icons/mysql.png'
         })
         svgAppend(parentGfx, customIcon)
         return customIcon
      }
      this.handlers['miyue:SqlTask'] = sqlRender
   }
}
```
