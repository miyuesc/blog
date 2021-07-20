### 1. 创建/更新元素属性，或者导出文件时报错 cannot read property 'isGeneric'

![输入图片说明](https://images.gitee.com/uploads/images/2021/0525/163440_35aff760_1832158.png "屏幕截图.png")

原因：
常见于 Vue 项目。由于更新时 Bpmn 接收的参数类型应该为 `ModdleElement` 类型，但是在编写组件时将对应的数据保存进了 `data() { return { } }` 的某个数据中，所以被 vue 进行了响应式处理，更改了原型与属性，导致无法解析。

解决：
在 `data () { }` 中使用 _ 或者 $ 符号作为开头，或者不在 data 中进行声明直接对 this 进行赋值，可避免被响应式处理。



### 2. 导入xml或者创建新标签/属性时报错 Uncaught Error: unknown type <xxx:xxx>

![输入图片说明](https://images.gitee.com/uploads/images/2021/0525/165606_bb16a8c3_1832158.png "屏幕截图.png")

原因：
当前选用的表述文件（一个 json 文件， 比如该项目中 package/process-designer/plugins/descriptor/ 下的三个文件）不支持该标签/属性

解决：
根据需要的标签/属性类型，在对应的描述文件类增加对应的标签/属性。具体描述文件格式参见 [bpmn 自定义解析文件](https://gitee.com/MiyueSC/blog/blob/master/bpmn/docs/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%A7%A3%E6%9E%90%E6%96%87%E4%BB%B6.md)



### 3. 更改元素/连线颜色

#### 3.1. modeler 模式

直接使用 `modeling.setColor(els, option)` 方法更改元素颜色或者其他属性。

#### 3.2. viewer 模式

1. 使用 `canvas.addMarker(elId, marker)` 为元素添加一个 class 类名，之后为该类添加 css 样式。
2. 使用 `overlays.add(elId, option)` 为元素添加一个遮罩层，为遮罩层添加 css 样式。

> viewer 模式下的方式在 modeler 模式也可以使用。



### 4. 隐藏 bpmn.io 画布 logo

添加全局样式

``` css
a.bjs-powered-by {
    display: none
}
```

> 注意：虽然 bpmn.js 为开源项目，但是作者要求不能隐藏该组织 logo，所以请各位在开发时尽量保留该内容。



### 5. 阻止 contentPad 删除事件

根据 bpmn 官方论坛的一些解决方案，添加 bpmnlint 规则可能并不能在点击删除按钮之后进行删除操作之前阻止元素被删除。所以要在点击 删除按钮之后根据条件判断是否进行删除，可以重写 contentPad 的删除功能。

#### 5.1 定义 customContentPad

创建 `CustomContentPadProvider.js` 

```javascript
class CustomContextPadProvider {
  constructor(contextPad, rules, modeling, translate) {
    contextPad.registerProvider(this);

    this._rules = rules;
    this._modeling = modeling;
    this._translate = translate;
  }
}

CustomContextPadProvider.$inject = [
  "contextPad",
  "rules",
  "modeling",
  "translate"
];

export default {
  __init__: ["customContextPadProvider"],
  customContextPadProvider: ["type", CustomContextPadProvider]
};
```

#### 5.2 定义新的删除规则

在定义新的规则之前，需要删除原有的删除规则。

```javascript
// 在 CustomContextPadProvider 类中定义 getContextPadEntries 方法
class CustomContextPadProvider {
  // ...
  
  // 传入参数为当前的选中元素
  getContextPadEntries(element) {
    const rules = this._rules;
    const translate = this._translate;
    const modeling = this._modeling;
    
    // entries 为原有的 contentPad 操作列表
    return function (entries) {
      // 1. 编写删除判断逻辑
      const deleteAllowed = true;
      
      // 2. 删除原来的 delete 操作
      delete entries["delete"];
      
      // 3. 插入自定义的删除操作按钮
      entries["delete"] = {
        group: "edit",
        className: "bpmn-icon-trash",
        title: translate("Remove"),
        action: {
          click: function (event) {
            if (!deleteAllowed) {
              alert("This is not allowed!");
            } else {
              modeling.removeElements([element]);
            }
          }
        }
      }
      
      // 4. 返回 contentPad 操作按钮
      return entries;
    }
  }
}
```

#### 5.3 在初始化 modeler 时引入自定义的 contentPad

```javascript
import Modeler from "bpmn-js/lib/Modeler";
import customContextPadProviderModule from "./CustomContextPadProvider";

const container = document.getElementById("container");

const modeler = new Modeler({
  container,
  additionalModules: [customContextPadProviderModule],
  keyboard: {
    bindTo: document
  }
});
```

### 6. 使用 cdn 引入 bpmn.js 时无法渲染

> 这个问题主要出现在我的个人开源项目 [bpmn-process-designer](https://github.com/miyuesc/bpmn-process-designer) 中，现已禁用原有功能。

**主要问题：**

在页面加载时出现无法正常初始化组件的情况，流程编辑器BpmnModeler实例无法正常实例化。

主要问题也能在错误信息中发现，在自定义palette时发生错误，无法正常找到自定义侧边栏 customPalette。

![image-20210720160511276](https://gitee.com/MiyueSC/image-bed/raw/master/image-20210720160511276.png)



**原因：**

在自定义palette的构造函数的时候，继承了原生的 paletteProvider，但是没有注入依赖实例，导致实例化时无法找到依赖的其他实例对象。



**解决：**

在自定义 paletteProvider 中添加依赖注入

```javascript
import PaletteProvider from "bpmn-js/lib/features/palette/PaletteProvider";

export default function CustomPalette(palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect, translate) {
  PaletteProvider.call(this, palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect, translate, 2000);
}

// 注入依赖
CustomPalette.$inject = ["palette", "create", "elementFactory", "spaceTool", "lassoTool", "handTool", "globalConnect", "translate"];
```

