# Bpmn 节点属性

### 主要留意属性/内容

```
shape: {
		id: "节点id",
        type: "节点类型",
    	x: "x轴坐标",
        y: "y轴坐标",
        width: "宽度",
        height: "高度",
        businessObject: {
            	$type: "与上级 type 一致",
                documentation: "元素文档"，
                extensionElements: "包含监听器、输入输出、扩展属性等",
                formKey: "绑定表单key",
                id: "与上级 id 一致",
                name: "节点名称",
                $attrs: {}, // 自定义属性
                $parent: {} // 父级元素
        }，
        outgoing: refs[], // 直连的出口元素（通常为连接线）
        incoming: refs[] //  直连的来源元素（通常为连接线）
}
```

### 属性分析

> ```javascript
> // 原始实例和工具类实例
> this.modeler = new BpmnModeler(options);
> const eventBus = this.modeler.get("eventBus");
> const modeling = this.modeler.get("modeling");
> const elementRegistry = this.modeler.get("elementRegistry");
> const bpmnFactory = this.modeler.get("bpmnFactory");
> const moddle = this.modeler.get("moddle");
> // 获取选中元素（这里监听鼠标单击事件）
> eventBus.on("element.click", (e) => {
>          if (!e || !e.element) return;
>  		this.element = e.element;
>        });
> // 保证元素有效
> const shape = this.modeler.get("elementRegistry").get(this.element.id);
> ```

#### 1. 基础信息

1. <code>Shape.id</code>：节点唯一标识，新增节点自动生成，自动生成节点有固定单词开头
2. <code>Shape.type</code>: 节点类型
3. <code>Shape.businessObject</code>: 节点的绑定属性，常用于业务流转；原生支持属性会同步更新到xml的节点内部；不具有get/set方法，vue2.x好像不能直接监听变化
4. <code>Shape.order</code>: 暂时还不了解
5. <code>Shape.parent</code>: 父级元素，与<code>businessObject</code>内的<code>$parent</code>一致

#### 2. <code>BusinessObject</code>

>  包含节点的大部分配置信息与自定义属性，属性更新可使用<code>updateProperties</code>方法
>
>  ```JavaScript
>  modeling.updateProperties(shape, {
>     name: "节点1",
>     myConfig: { nodeName: "nodeName1" }
>  });
>  ```
>
>  原生支持属性会同步更新到<code>Shape.businessObject</code>内，并更新到xml节点内；用户自定义属性，会更新到<code>Shape.businessObject.$attrs</code>内，并转换为<code>{ [key: string]: string }</code>的形式更新为xml节点标签的属性。
>
>  比如上面的<code>myConfig</code>会更新为<code><userTask id="xxx" myConfig="[object Object]">...</userTask></code>

##### 2.1 <code>documentation</code>元素文档

<code>BusinessObject.documentation</code>: <code>ModdleElement[]</code>

```javascript
// 变量和工具类的声明方式在上面
// 创建元素文档
const DOC  = bpmnFactory.create("bpmn:Documentation", { text: "测试元素文档" })
// 更新到节点
modeling.updateProperties(shape, {
	documentation: [ DOC ]
})
```

##### 2.2 <code>extensionElements</code>扩展配置

> 包含两个属性： <code>$type: "bpmn:ExtensionElements"</code> 和<code>values: ModdleElement[]</code>
>
> <code>values</code>内部包含的常用类型有<code>[ "camunda:InputOutput", "camunda:Properties", "camunda:ExecutionListener", "camunda:TaskListener", "camunda:FormData" ]</code>

1. <code>camunda:InputOutput</code>输入输出



2. <code>camunda:Properties</code>扩展属性

```javascript
// 1. 创建一个扩展属性
const exCamProperty = bpmnFactory.create("camunda:Property", {
    name: "clickAdd", 
    value: "definedWithJS"
});
console.log("exCamProperty", exCamProperty);
// 2. 创建一组扩展属性分组（默认panel只有一个， 包含若干个 扩展属性）
const exProperties = bpmnFactory.create("camunda:Properties", { values: [] });
console.log("exProperties", exProperties);
// 3. 创建节点的扩展配置项
const extensions = bpmnFactory.create("bpmn:ExtensionElements", { values: [] });
console.log("extensions", extensions);
// 组装数据
exProperties.values.push(exCamProperty);
extensions.values.push(exProperties);
// 更新到节点
this.modeling.updateProperties(element, {
	extensionElements: extensions
});

// 更新后的结果（xml）
// <userTask id="Activity_1owrwsz">
//    <extensionElements>
//    <camunda:properties>
//        <camunda:property name="clickAdd" value="definedWithJS" />
//        </camunda:properties>
// 	 </extensionElements>
// </userTask>
```



3. <code>camunda:ExecutionListener</code> 监听器 -- 执行监听



4. <code>camunda:TaskListener</code>监听器 -- 任务监听



5. <code>camunda:FormData</code>表单



## 两个条件配置的连接线

> 基础信息与节点差不多 

### 属性分析

#### <code>BusinessObject</code>

##### 1. <code>BusinessObject.ConditionExpression</code>

连线对应条件表达式/脚本配置

```javascript
// 变量和工具类的声明方式在上面
// 创建条件
const conditionExpression  = moddle.create("bpmn:FormalExpression", { body: "${ handle == 'pass' }" })
// 更新到节点
modeling.updateProperties(shape, {
	conditionExpression: conditionExpression
})
```



##### 2. <code>BusinessObject.sourceRef</code>

连接线来源元素

##### 3. <code>BusinessObject.targetRef</code>

连接线目标元素




