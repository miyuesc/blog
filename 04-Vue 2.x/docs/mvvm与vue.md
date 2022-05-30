## 1. MVVM（Model-View-View-Model）模式

要编写可维护的前端代码绝非易事。我们已经用<font color="orange"><b>MVC（MVC全名是Model View Controller，是模型(model)－视图(view)－控制器(controller)的缩写）</b></font>模式通过<font color="red"><b>koa(Express的下一代基于Node.js的web框架)</b></font>实现了后端数据、模板页面和控制器的分离，但是，对于前端来说，还不够。

1. 很早之前，页面全是静态网页，预先编写html存放在web服务器，浏览器请求时直接返回html文件；
2. 之后，由于需要针对不同的用户显示不同的页面，于是需要服务器针对不同的用户生成不同的页面，个最直接的想法就是利用C、C++这些编程语言，直接向浏览器输出拼接后的字符串。这种技术被称为CGI：Common Gateway Interface；
3. 再之后，由于新浪之类的复杂页面不能通过拼接字符串完成，在拼字符串的时候，大多数字符串都是HTML片段，是不变的，变化的只有少数和用户相关的数据，所以，又出现了新的创建动态HTML的方式：ASP、JSP和PHP——分别由微软、SUN和开源社区开发。在ASP中，一个asp文件就是一个HTML，但是，需要替换的变量用特殊的<%=var%>标记出来了，再配合循环、条件判断，创建动态HTML就比CGI要容易得多；这种情况如果要更新页面信息，就只能刷新页面重新向服务器请求。
4. 后来，浏览器引入JavaScript之后，js可以对页面进行一些修改。JavaScript还可以通过修改HTML的DOM结构和CSS来实现一些动画效果，而这些功能没法通过服务器完成，必须在浏览器实现。用JavaScript在浏览器中操作HTML，经历了若干发展阶段：
	- 第一阶段，直接用JavaScript操作DOM节点，使用浏览器提供的原生API
	- 第二阶段，由于原生API不好用，还要考虑浏览器兼容性，jQuery横空出世，以简洁的API迅速俘获了前端开发者的芳心
	- 第三阶段，MVC模式，需要服务器端配合，JavaScript可以在前端修改服务器渲染后的数据
	- 现在，MVVM模式，由微软提出，鉴了桌面应用程序的MVC思想，在前端页面中，把Model用纯JavaScript对象表示，View负责显示，两者做到了最大限度的分离。把Model和View关联起来的就是ViewModel。ViewModel负责把Model的数据同步到View显示出来，还负责把View的修改同步回Model。

目前常用MVVM框架：React，Angular，Vue，另外还有Backbone，Ember等，但入门困难。

### 1.1 单向绑定

单向绑定: 把Model绑定到View，当我们用JavaScript代码更新Model时，View就会自动更新

在Vue中，可以直接写<code>{{ name }</code>}绑定某个属性。如果属性关联的是对象，还可以用多个.引用，例如:

<code>{{ address.zipcode }}</code>。

另一种单向绑定的方法是使用Vue的指令v-text，写法如下:

<code>Hello, <span v-text="name"></span>!</code>

这种写法是把指令写在HTML节点的属性上，它会被Vue解析，该节点的文本内容会被绑定为Model的指定属性，注意不能再写双花括号{{ }}

### 1.2 双向绑定

双向绑定：用户更新了View，Model的数据也自动被更新了，这种情况就是双向绑定。

example：
	<font color="pink">填写表单就是一个最直接的例子。当用户填写表单时，View的状态就被更新了，如果此时MVVM框架可以自动更新Model的状态，那就相当于我们把Model和View做了双向绑定</font>

vue 双向绑定：
```javascript
// 1.创建vm实例
$(function() {
	var vm = new Vue({
		...
        data: {
        	email: "",
        	name: ""
        },
        methods: {
        	register: function {
        		// 显示JSON格式model
        		console.info(JSON.stringify(this.$data));
        		// TODO: AJAX.post
        	}
        }
	})
	window.vm = vm;
})
```

```html
<!-- 编写表单 -->
<form id="vm" action="server src" v-on:submit.prevent="register">
    <p><input v-model="email"></p>
    <p><input v-model="name"></p>
</form>
```

我们可以在表单中输入内容，然后在浏览器console中用<code>window.vm.$data</code>查看Model的内容，也可以用<code>window.vm.name</code>查看Model的name属性，它的值和FORM表单对应的<code>input</code>标签是一致的。

如果在浏览器console中用JavaScript更新Model，例如，执行<code>window.vm.name='Bob'</code>，表单对应的input输入框内容就会立刻更新。

<code> v-on:submit="register"</code>指令就会自动监听表单的submit事件，并调用register方法处理该事件。使用<code>.prevent</code>表示阻止事件冒泡，这样，浏览器不再处理form表单内的submit事件。在register函数中，我们将数据通过ajax发送给服务器，这样就完成了注册功能。

### 1.3 DOM同步

使用MVVM，当我们更新Model时，DOM结构会随着Model的变化而自动更新。

在Vue中，可以使用v-for指令来实现：
```html
<ol>
    <li v-for="t in todos">
        <dl>
            <dt>{{ t.name }}</dt>
            <dd>{{ t.description }}</dd>
        </dl>
    </li>
</ol>
```

v-for指令把数组和一组<code>li</code>元素绑定了。在<code>li</code>元素内部，用循环变量t引用某个属性，例如，<code>{{ t.name }}</code>。这样，我们只关心如何更新Model，不关心如何增删DOM节点，大大简化了整个页面的逻辑。

## 2 Vue讲解

### 2.1 模板语法

#### 1. 文本

Vue数据绑定常见形式：“mustache”语法（双大括号），<code>v-text</code>指令

```
<tempalte>
	<div>
		<p>hello {{ word }}</p>
		<p v-text="'hello' + word"></p>
		<p>{{`hello${ word }`}}</p>
	<div>
</template>

<script>
export default {
     data () {
         return {
              world : "world"
         }
     }
}
</script>
```

#### 2. v-once

通过指令我们可以对文本值进行一次性赋值操作，只进行第一次的数据渲染，如果再次改变值，文本值也不会改变。

#### 3. 纯html

我们在解析的不是文件而是一个html格式的时候放在<code>v-text</code>中或者"{{  }}"就会被当作一个文本解析，所以我们此时要用v-html指令进行解析，<font color="red">在1.0中支持"{{{    }}}"这种格式，为了防止xss功击，去除了这个功能</font>。

```
<template>
    <div>
        <p v-html='html'></p>
     </div>
</template>

<script>
export default {
     data () {
         return {
              html : `<span style='color : red;'>显示红色的字你就解析成功了</span>`
         }
     }
}
</script>
```

#### 4. 属性

用指令去解析，那就是<code>v-bind:*</code>,同时我们可以简写用v-bind语法糖 ：即可。

*我们在属性中支持number、string、boolean类型，以上显示能在界面中看出都能正常进行和原本属性所预期的，不用：来绑定的属性可以直接属性赋值，如果一定要通过data数据选项中返回的值一定要加 ：*

#### 5. 使用JavaScript表达式

在业务场景中一些方法判断或者简单的过滤，那我们可以用javascript表达式，能让代码更简洁，更清晰，例如三元表达式，filter语法等

#### 6. 修饰符

修饰符（Modifiers）是以半角句号 . 指明的特殊后缀，用于指出一个指令应该以特殊方式绑定。官方文档有详细解说每一个修饰赋的具体用途

#### 7. 再次提示主逻辑代码都是写在.App.vue中,所有其它的组件代码都是写在componentes里

正常的情况在一个单个组件内部自己使用v-on的事件，都不会有问题，如果在一个组件上定义一个指令事件，必须要用<code>.native</code>

#### 8. 列表渲染

1. template v-for 模板渲染

使用<code>template</code>标签来渲染多个元素块，同时避免创建多个dom节点。

```
<template>
     <div>
         <template v-for="item in list">
              <p>{{item.content}}</p>
              <img :src="item.img" alt="">
              <p class="divider"></p>
         </template>
     </div>
</template>
```

2. Object v-for 对象渲染

用 v-for 通过一个对象的属性来迭代。

```
<template>
     <table>
         <template>
            <tr>
                <td v-for="(value,key) in memberDetail" :key="key">{{key}}</td>
            </tr>
            <tr>
                <td v-for="(value,key) in memberDetail" :key="key">{{value}}</td>
            </tr>
         </template>
     </table>
</template>

<script>
export default {
     created () {
        //比方说我们这里拿到前面的custId传给后台拿到用户数据
        this.memberDetail = {
                 name : 'ziksang',
                 age : 20,
                 address : "xxx省xxxx市",
                 tel : "15921898427"
             }
     },
     data () {
         return {
             memberDetail : {} 
         }
     }
}
</script>
<style>
body,html{
    width:100%;
    height:100%
}
.divider{
    width:100%;
    height:1px;
    background:black;
}
</style>
```

3. component v-for 组件渲染

4. 数组更新检测
	- 数组变异：用Array.prototype里提供的原型方法里我们能直接改掉data选项里的数据，触发了视图更新（例如：push，pop，shift，unshift，splice等）
	- 数组非变异：能通过Array.prototype里的原形方法改变data选项artList数组触发视图改变的方法就是非变异方法，其余的方法都是操作后，形成一个返回值，所有操作只是返回了一个新数组，而不会触发视图更新（1.filter(), 2.concat(), 3.slice(), 4.map()）

5. 注意事项：

由于 JavaScript 的限制， Vue 不能检测以下变动的数组：
当你利用索引直接设置一个项时，例如：<code>vm.items[indexOfItem] = newValue</code>
当你修改数组的长度时，例如：<code>vm.items.length = newLength</code>