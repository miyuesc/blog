# CSS 基础

**层叠样式表**（英语：**C**ascading **S**tyle **S**heets，缩写：**CSS**；又称**串样式列表**、**级联样式表**、**串接样式表**、**阶层式样式表**）是一种用来为结构化文档（如[HTML](https://zh.wikipedia.org/wiki/HTML)文档或[XML](https://zh.wikipedia.org/wiki/XML)应用）添加样式（字体、间距和颜色等）的[计算机语言](https://zh.wikipedia.org/wiki/计算机语言)，由[W3C](https://zh.wikipedia.org/wiki/W3C)定义和维护。

组成：由多个“规则”组成，每个规则包含“选择器”、“属性”和“值”组成。

- 选择器（Selector）：多个选择器可以半角逗号（,）隔开。
- 属性（property）：CSS1、CSS2、CSS3规定了许多的属性，目的在控制选择器的样式。
- 值（value）：指属性接受的设置值，多个关键字时大都以空格隔开。



## 1. 选择器

### 1.1 选择器类型

1. 基本选择器

    - 类名：`.box`
    - 标签：`div`
    - 属性： `input[type="eamil"]` 、 `a[href*="http://www.beige.world"]`
    - ID：`#box`
    - 通用选择器：`*`

2. 伪类选择器

    - 结构伪类： `:nth-child(n) | :nth-of-type(n) | :hover `
    - 伪元素： `::before | ::after `

3. 组合选择器

    - 相邻兄弟 `A + B`
    - 普通兄弟 `A ~ B`
    - 子选择器 `A > B`
    - 后代选择器 `A  B`
4. 属性值匹配

    |  类型代码	|说明|
    | :----------- | :----------------------------------------- |
    |`[attribute]`| 元素有 attribute 的属性。 |
    |`[attribute="value"]`	|属性 attribute 里是 value|
    |`[attribute~="value"]`| 属性 attribute 里使用空白分开的字符串里其中一个是value |
    |`[attribute|="value"]`| 属性 attribute 里是 value 或者以 value- 开头的字符串 |
    |`[attribute^="value"]`| 属性 attribute 里最前的是 value |
    |`[attribute$="value"]`| 属性 attribute 里最后的是 value |
    |`[attribute*="value"]` | 属性 attribute 里有 value 出现过至少一次 |


~~~css
// example

div[class^="el-"] {}

a[href$="gitbub.io"] {}

span[title*="__name"] {}
~~~

### 1.2 选择器优先级

1. 越特殊越优先，指向越准确越优先
2. 行内样式优先级最高
3. 多个class类时，后面的会覆盖前面的

权重加分项：

- 1个行内样式占1000分
- 1个id选择器占100分
- 1个class选择器占10分
- 1个标签选择器占1分

| 标签选择器                                                   | 计算权重公式 |
| ------------------------------------------------------------ | ------------ |
| 继承或者 *                                                   | 0,0,0,0      |
| 每个元素（标签选择器）                                       | 0,0,0,1      |
| 每个类，结构伪类(如:hover),属性选择器 <code>[type="number"]</code> | 0,0,1,0      |
| 每个<code>ID</code>                                          | 0,1,0,0      |
| 每个行内样式 <code>style=""</code>                           | 1,0,0,0      |
| <code>h1 + p::first-line</code>                              | 0,0,0,3      |
| <code>li > a[href*="beige.world"] > .inline-warning</code>   | 0,0,2,2      |
| 每个 <code>!important</code>  重要的，后者覆盖前者           | ∞ 无穷大     |



## 2. 背景

可使用纯色、渐变色、图片作为背景。

| 属性                    | 描述                                         |
| :---------------------- | :------------------------------------------- |
| `background`            | 简写属性，作用是将背景属性设置在一个声明中。 |
| `background-attachment` | 背景图像是否固定或者随着页面的其余部分滚动。 |
| `background-color`      | 设置元素的背景颜色。                         |
| `background-image`      | 把图像设置为背景。                           |
| `background-position`   | 设置背景图像的起始位置。                     |
| `background-repeat`     | 设置背景图像是否及如何重复。                 |

### 2.1 `background-attachment`

| 值      | 描述                                                    |
| :------ | :------------------------------------------------------ |
| scroll  | 默认值。背景图像会随着页面其余部分的滚动而移动。        |
| fixed   | 当页面的其余部分滚动时，背景图像不会移动。              |
| inherit | 规定应该从父元素继承 background-attachment 属性的设置。 |

### 2.2 `background-color`

| 值          | 描述                                                   |
| :---------- | :----------------------------------------------------- |
| color_name  | 规定颜色值为颜色名称的背景颜色（比如 red）。           |
| hex_number  | 规定颜色值为十六进制值的背景颜色（比如 #ff0000）。     |
| rgb_number  | 规定颜色值为 rgb 代码的背景颜色（比如 rgb(255,0,0)）。 |
| transparent | 默认。背景颜色为透明。                                 |
| inherit     | 规定应该从父元素继承 background-color 属性的设置。     |

### 2.3 `background-image`

| 值         | 描述                                               |
| :--------- | :------------------------------------------------- |
| url('URL') | 指向图像的路径。                                   |
| none       | 默认值。不显示背景图像。                           |
| inherit    | 规定应该从父元素继承 background-image 属性的设置。 |

### 2.4 `background-position`

| 值                                                           | 描述                                                         |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| top left、top  center、top right、center left、center center、center right、bottom left、bottom cente、rbottom right | 如果您仅规定了一个关键词，那么第二个值将是"center"。默认值：0% 0%。 |
| x% y%                                                        | 第一个值是水平位置，第二个值是垂直位置。左上角是 0% 0%。右下角是 100% 100%。如果您仅规定了一个值，另一个值将是 50%。 |
| xpos ypos                                                    | 第一个值是水平位置，第二个值是垂直位置。左上角是 0 0。单位是像素 (0px 0px) 或任何其他的 CSS 单位。如果您仅规定了一个值，另一个值将是50%。您可以混合使用 % 和 position 值。 |

### 2.5 `background-repeat`

| 值        | 描述                                                |
| :-------- | :-------------------------------------------------- |
| repeat    | 默认。背景图像将在垂直方向和水平方向重复。          |
| repeat-x  | 背景图像将在水平方向重复。                          |
| repeat-y  | 背景图像将在垂直方向重复。                          |
| no-repeat | 背景图像将仅显示一次。                              |
| inherit   | 规定应该从父元素继承 background-repeat 属性的设置。 |

## 3. 文本

| 属性               | 描述                           |
| :----------------- | :---------------------------- |
| color | 设置文本颜色                     |
| direction | 设置文本方向。                       |
| line-height | 设置行高。                     |
| letter-spacing | 设置字符间距。                 |
| text-align | 对齐元素中的文本。                      |
| text-decoration | 向文本添加修饰。           |
| text-indent | 缩进元素中文本的首行。                |
| ext-shadow   | 设置文本阴影。CSS2 包含该属性，但是 CSS2.1 没有保留该属性。 |
| text-transform | 控制元素中的字母。        |
| unicode-bid  | 设置文本方向。    |
| white-space | 设置元素中空白的处理方式。                |
| word-spacing | 设置字间距。            |

## 4. 列表

| 属性                | 描述                                                 |
| :------------------ | :--------------------------------------------------- |
| list-style          | 简写属性。用于把所有用于列表的属性设置于一个声明中。 |
| list-style-image    | 将图象设置为列表项标志。                             |
| list-style-position | 设置列表中列表项标志的位置。                         |
| list-style-type     | 设置列表项标志的类型。                               |
| marker-offset       |                                                      |

## 5. 表格

| 属性            | 描述                                 |
| :-------------- | :----------------------------------- |
| border-collapse | 设置是否把表格边框合并为单一的边框。 |
| border-spacing  | 设置分隔单元格边框的距离。           |
| caption-side    | 设置表格标题的位置。                 |
| empty-cells     | 设置是否显示表格中的空单元格。       |
| table-layout    | 设置显示单元、行和列的算法。         |





