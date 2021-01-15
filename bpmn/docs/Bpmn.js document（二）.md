## 四. Modules


#### 9. AlignElements 元素对齐

`diagram.js` 模块，注入模块 `Modeling`。主要用作元素对齐。

> 会按照元素对齐方向的边界对齐。

**使用：**

```javascript
const AlignElements = this.bpmnModeler.get("alignElements");

/**
 * Executes the alignment of a selection of elements
 * 执行元素选择的对齐
 *
 * @param  {Array} elements 通常为节点元素
 * @param  {string} type 可用：left|right|center|top|bottom|middle
 */
AlignElements.trigger(Elements, type);
```

**改写：**

```javascript
// index.js
import AlignElements from './AlignElements';

export default {
  __init__: [ 'alignElements' ],
  alignElements: [ 'type', AlignElements ]
};

// AlignElements.js
export default function AlignElements(modeling) {
  this._modeling = modeling;
}

AlignElements.$inject = [ 'modeling' ];

AlignElements.prototype.trigger = function(elements, type) {
    // 对齐逻辑
}
```



#### 10. AttachSupport 依附支持

`diagram.js` 模块，注入模块 `injector, eventBus, canvas, rules, modeling`，依赖规则模块 `rulesModule`。主要用作元素移动期间的绑定关系和预览。

> 基础逻辑模块，不推荐更改，也不提供直接使用的方法。



#### 11. AutoPlace 元素自动放置

将元素自动放置到合适位置（默认在后方，正后方存在元素时向右下偏移）并调整连接的方法。通常在点击 `contentPad` 创建新元素的时候触发。

注入基础模块 `eventBus` 与 `modeling`。

> 默认会初始化一个放置后选中元素的方法。

**使用：**

```javascript
const AutoPlace = this.bpmnModeler.get("autoPlace");

/**
 * Append shape to source at appropriate position.
 * 将形状添加的源对应的合适位置
 * 会触发 autoPlace.start autoPlace autoPlace.end 三个事件
 *
 * @param {djs.model.Shape} source ModdleElement
 * @param {djs.model.Shape} shape ModdleElement
 *
 * @return {djs.model.Shape} appended shape
 */
AutoPlace.append(source, shape, hints);
```



#### 12. AutoResize 元素大小调整

一个自动调整大小的组件模块，用于在创建或移动子元素接近父边缘的情况下扩展父元素。

注入模块 `eventBus, elementRegistry, modeling, rules`

> 暂时没找到怎么直接调用

**重写/禁用：**

```javascript
// 重写
// index.js
import AutoResize from './AutoResize';

export default {
  __init__: [ 'autoResize' ],
  autoResize: [ 'type', AutoResize ]
  // 禁用直接设置 autoResize: [ 'type', "" ] 或者 autoResize: [ 'type', （） => false ]
};

// AutoResize.js
export default function AutoResize(eventBus, elementRegistry, modeling, rules) {
    // ...
}

AutoResize.$inject = [
  'eventBus',
  'elementRegistry',
  'modeling',
  'rules'
];

inherits(AutoResize, CommandInterceptor); // CommandInterceptor 向commandStack中插入命令的原型。
```

#### 13. AutoScroll 画布滚动

 画布自动扩展滚动的方法，如果当前光标点靠近边框，则开始画布滚动。 当当前光标点移回到滚动边框内时取消或手动取消。

依赖于 `DraggingModule` ，注入模块 `eventBus, canvas`

> 函数原型上传入了 `config` ，但打印为 `undefined`

**使用与方法：**

```javascript
const AutoScroll = this.modeler.get("autoScroll");

/**
 * Starts scrolling loop.
 * 开始滚动
 * Point is given in global scale in canvas container box plane.
 *
 * @param  {Object} point { x: X, y: Y }
 */
AutoScroll.startScroll(point);

// 停止滚动
AutoScroll.stopScroll();

/**
 * 覆盖默认配置
 * @param {Object} options 
 * options.scrollThresholdIn: [ 20, 20, 20, 20 ],
 * options.scrollThresholdOut: [ 0, 0, 0, 0 ],
 * options.scrollRepeatTimeout: 15,
 * options.scrollStep: 10
 */
AutoScroll.setOptions(options);
```

