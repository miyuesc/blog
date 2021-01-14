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

AlignElements.prototype.trigger = function(elements, type) {}
```



#### 10. AttachSupport 依附支持



#### 11. AutoPlace 元素自动放置



#### 12. AutoResize 元素大小调整



#### 13. AutoScroll 画布滚动

 