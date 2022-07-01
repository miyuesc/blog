---
theme: vuepress
highlight: obsidian
---

> 由于 bpmn.js 内部各个模块相互独立，很难编写出全面且流畅的使用教程，之前写的文章也常常是写到一半便没了头绪，所以看起来和没看没什么区别。
>
> 现在在了解了 bpmn.js 与 diagram.js 的源码，并对相关模块和插件进行了 dts (typescript declare) 的编写之后，心里大致明白如何在原来的基础上进行扩展与重置，所以希望这篇文章能写的尽量全面和清晰，减少大家入坑时消耗的时间和精力。
>
> 上节 [Bpmn.js简介与基础使用 - 掘金](https://juejin.cn/post/7064485347186442271) 中，讲述了 bpmn.js 的简介和相关底层依赖，以及在 Vue 2.x 项目中的基础使用。本篇将在该基础上介绍几种常见 `additionalModule` 的扩展和自定义重写。
>
> 本篇示例代码将采用 `Vue 3.0` 结合 `Pinia` 和 `Tsx` 来展示，并且 bpmn.js 版本为 9.2，具体项目Demo见 [Vite Vue Process Designer](https://miyuesc.github.io/vite-vue-bpmn-process/)

## 1. 创建基础页面

首先，我们需要创建一个“容器”，用来显示 `Designer` 流程设计器实例 与 `PropertiesPenal` 属性配置边栏。根据 `bpmn-js-properties-penal` 仓库的说明，只需要在页面放置一个 `Div` 并设置对应的 `id` 即可，在后续初始化设计器实例时将边栏元素 `id` 传递给 `Modeler` 构造函数。

当然，一个“设计器”不可能没有工具栏，所以我们也需要实现一个 `Toolbar` 组件，用来提供放大缩小、撤销恢复等相关功能。

```tsx
import { defineComponent, computed, ref } from 'vue'
import Designer from '@/components/Designer'
import Toolbar from '@/components/Toolbar'

const App = defineComponent({
    setup() {
        return () => (
            <div class="main-content">
                <Toolbar></Toolbar>
                <Designer v-model={[processXml.value, 'xml']}></Designer>
                <div class="camunda-penal" id="camunda-penal"></div>
            </div>
        )
    }
})

export default App
```

## 2. 创建 Modeler 组件

当前步骤主要是初始化一个基础的 `BpmnModeler` 实例，包含默认的功能模块；并且使用 `Pinia` 来缓存当前的 `Modeler` 实例。

```tsx
// Designer/index.tsx
import { defineComponent, ref, onMounted } from 'vue'
import modulesAndModdle from '@/components/Designer/modulesAndModdle'
import initModeler from '@/components/Designer/initModeler'
import { createNewDiagram } from '@/utils'

const Designer = defineComponent({
    name: 'Designer',
    emits: ['update:xml', 'command-stack-changed'],
    setup(props, { emit }) {
        const designer = ref<HTMLDivElement | null>(null)

        onMounted(() => {
            const modelerModules = modulesAndModdle()
            initModeler(designer, modelerModules, emit)
            createNewDiagram()
        })

        return () => <div ref={designer} class="designer"></div>
    }
})

export default Designer
```


```typescript
// store/modeler.ts
import { defineStore } from 'pinia'

type ModelerStore = {
    activeElement: Base | undefined
    activeElementId: string | undefined
    modeler: Modeler | undefined
    moddle: Moddle | undefined
    modeling: Modeling | undefined
    canvas: Canvas | undefined
    elementRegistry: ElementRegistry | undefined
}

const defaultState: ModelerStore = {
    activeElement: undefined,
    activeElementId: undefined,
    modeler: undefined,
    moddle: undefined,
    modeling: undefined,
    canvas: undefined,
    elementRegistry: undefined
}

export default defineStore('modeler', {
    state: () => defaultState,
    getters: {
        getActive: (state) => state.activeElement,
        getActiveId: (state) => state.activeElementId,
        getModeler: (state) => state.modeler,
        // 这里的后续步骤也可以改写成 getXxx = (state) => state.modeler?.get('xxx')
        getModdle: (state) => state.moddle,
        getModeling: (state) => state.modeling,
        getCanvas: (state) => state.canvas,
        getElRegistry: (state) => state.elementRegistry
    },
    actions: {
        setModeler(modeler) {
            this.modeler = modeler
        },
        setModules<K extends keyof ModelerStore>(key: K, module) {
            this[key] = module
        },
        setElement(element: Base, id: string) {
            this.activeElement = element
            this.activeElementId = id
        }
    }
})
```

这一步相信大多数人都能理解

1. 通过 `modulesAndModdle` 获取到对应的配置项
2. 调用 `initModeler()` 来实例化 `bpmn.js` 的 `Modeler` 构造函数
3. 最后调用 `createNewDiagram()` 来创建一个基础的流程图。

`store/modeler.ts` 内部则是创建了一个数据状态缓存，用来保存 `Modeler` 实例，以及提供基础功能模块的 `getter` 方法。

> 其中 `modulesAndModdle` 部分为本篇核心部分，这里先跳过，后续进行讲解。

以下是 `initModeler` 和 `createNewDiagram` 方法的具体代码：

```typescript
// 1. initModeler.ts
import modeler from '@/store/modeler'
import { markRaw, Ref } from 'vue'

export default function (designer: Ref<HTMLElement | null>, modelerModules: ViewerOptions<Element>, emit) {
    const modelerStore = modeler()

    const options: ViewerOptions<Element> = {
        container: designer!.value as HTMLElement,
        additionalModules: modelerModules[0] || [],
        moddleExtensions: modelerModules[1] || {},
        propertiesPanel: {
            parent: '#camunda-penal'
        },
        ...modelerModules[2]
    }

    const modeler: Modeler = new Modeler(options)

    // 更新 store 缓存数据，这里使用 markRaw 定义非响应式处理，避免 proxy 代理影响原始状态和方法
    store.setModeler(markRaw(modeler))
    store.setModules('moddle', markRaw(modeler.get<Moddle>('moddle')))
    store.setModules('modeling', markRaw(modeler.get<Modeling>('modeling')))
    store.setModules('canvas', markRaw(modeler.get<Canvas>('canvas')))
    store.setModules('elementRegistry', markRaw(modeler.get<ElementRegistry>('elementRegistry')))
}

```

```typescript
// createNewDiagram.ts
import modeler from '@/store/modeler'

export const createNewDiagram = async function (newXml?: string) {
    try {
        const modelerStore = modeler()
        const timestamp = Date.now()
        const newId: string = `Process_${timestamp}`
        const newName: string = `业务流程_${timestamp}`
        const processEngine: string = 'camunda'
        const xmlString = newXml || EmptyXML(newId, newName, processEngine)
        const modeler = store.getModeler
        const { warnings } = await modeler!.importXML(xmlString)
        if (warnings && warnings.length) {
            warnings.forEach((warn) => console.warn(warn))
        }
    } catch (e) {
        console.error(`[Process Designer Warn]: ${typeof e === 'string' ? e : (e as Error)?.message}`)
    }
}
```

## 3. Bpmn.js 的“实例化过程”

在 `initModeler` 时，我们传递进 `Modeler` 构造函数的参数主要包含四个部分：

1. `container` ：画布挂载的 `Div`，可以直接传递这个 `Div` 的元素实例，也可以传递该元素对应的 `id` 字符串
2. `additionalModules` ：Bpmn.js 所使用的相关插件，是一个对象数组
3. `moddleExtensions` ：用来进行 xml 字符串解析以及元素、属性实例定义的声明，是一个对象格式参数，通常 `key` 是声明的属性前缀，对应的属性值则是一个模块的所有扩展属性定义声明，通常为外部引入的一个json文件或者js对象
4. `options` ：其他配置项，包括上文提到的 `propertiesPanel`，这些配置项一般以插件实例的名称作为 `key`，用来给对应插件提供特殊的实例化配置参数

在进行 `new Modeler` 时，首先会与 bpmn.js 的 `Modeler` 默认配置进行合并，之后创建一个 `BpmnModdle(moddleExtensions)` 实例作为 `modeler._moddle` 的属性值，该模块主要用来进行 xml 字符串的解析和属性转换，也可以用来**注册新的解析规则**和**创建对应的元素实例**。
之后创建一个 DOM 节点作为画布区域，挂载到 `modeler._container` 上，并添加 bpmn-io 的 logo。
然后，会根据 `additionalModules` 和默认的 `{ bpmnjs: [ 'value', this ], moddle: [ 'value', moddle ] }` 合并，再合并 `canvas` 配置，调用 `Diagram` 进行后续逻辑，结束后再将 `_container` 挂载到传入的 `container` 对应的 DOM 节点上。

`additionalModules` 合并代码如下：

```javascript
var baseModules = options.modules || this.getModules(), // getModules() 返回 BaseViewer.prototype._modules = []
    additionalModules = options.additionalModules || [],
    staticModules = [
        {
            bpmnjs: [ 'value', this ],
            moddle: [ 'value', moddle ]
        }
    ];

var diagramModules = [].concat(staticModules, baseModules, additionalModules);

var diagramOptions = assign(omit(options, [ 'additionalModules' ]), {
    canvas: assign({}, options.canvas, { container: container }),
    modules: diagramModules
});

// invoke diagram constructor
Diagram.call(this, diagramOptions);
```

在 `new Diagram(diagramOptions)` 的过程中，主要是实例化 `Injector`，并触发 `diagram.init` 事件表示画布实例化结束。


### 3.1 Injector

上一章我们讲过，Bpmn.js 继承自 Diagram.js，采用依赖注入的形式来链接各个插件之间的引用关系。

这个进行依赖注入的注入器 `Injector`(源码见 [didi](https://github.com/nikku/didi)), 在进行 `new Modeler(options)` 时，便会进行一次实例化，对 `options` 内部的 `container` 和 `moddleExtensions` 之外的属性进行解析与实例化（部分），并挂载到 `Injector` 实例下的 `_instances` 上。并且在 `Modeler` 的实例上创建两个属性：`get` 和 `invoke`。

`get` 方法指向 `Injector` 实例的 `get` 方法，可以通过 `modeler.get('xxx')` 来获取对应的插件实例。

`invoke` 方法指向 `Injector` 实例的 `invoke(func, context, locals)` 方法，作用向插件系统中注入新插件和依赖的方法，会根据 `locals` 或者 `func.$inject` 来声明该函数对应的依赖关系。

> 所以源码中很多需要调用其他模块实例的构造函数，末尾都会有一个 `$inject` 静态属性。

**首先，`Injector` 是一个构造函数**

`Injector` 接收两个参数：`modules`, `parent`。 其中 `parent` 是可选参数，如果为空，会默认生成一个带有 `get()` 方法的对象参与后面的逻辑。


