---
theme: nico
highlight: a11y-dark
---

> 由于 bpmn.js 内部各个模块相互独立，很难编写出全面且流畅的使用教程，之前写的文章也常常是写到一半便没了头绪，所以看起来和没看没什么区别。
>
> 现在在了解了 bpmn.js 与 diagram.js 的源码，并对相关模块和插件进行了 dts (typescript declare) 的编写之后，心里大致明白如何在原来的基础上进行扩展与重置，所以希望这篇文章能写的尽量全面和清晰，减少大家入坑时消耗的时间和精力。
>
> 上节 [Bpmn.js简介与基础使用 - 掘金](https://juejin.cn/post/7064485347186442271) 中，讲述了 bpmn.js 的简介和相关底层依赖，以及在 Vue 2.x 项目中的基础使用。本篇将在该基础上介绍几种常见 `additionalModule` 的扩展和自定义重写。
>
> 本篇示例代码将采用 `Vue 3.0` 结合 `Pinia` 和 `Tsx` 来展示，并且 bpmn.js 版本为 9.2，具体项目Demo见 [Vite Vue Process Designer](https://miyuesc.github.io/vite-vue-bpmn-process/)

## 1. 创建基础页面

首先，我们需要创建一个“容器”，用来显示 `Designer` 流程设计器实例 与 `PropertiesPanel` 属性配置边栏。根据 `bpmn-js-properties-Panel` 仓库的说明，只需要在页面放置一个 `Div` 并设置对应的 `id` 即可，在后续初始化设计器实例时将边栏元素 `id` 传递给 `Modeler` 构造函数。

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
                <div class="camunda-Panel" id="camunda-Panel"></div>
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
            parent: '#camunda-panel'
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

从 `new Modeler()` 到 `new Diagram` 主要过程如下：

```typescript
function Modeler(options) {
    BaseModeler.call(this, options);
}
function BaseModeler(options) {
    BaseViewer.call(this, options);

    // 添加 导入解析完成事件 的监听，在解析正常时处理和保存元素id
    this.on('import.parse.complete', function(event) {
        if (!event.error) {
            this._collectIds(event.definitions, event.elementsById);
        }
    }, this);

    // 添加 销毁事件 的监听，在画布销毁时清空保存的元素ids
    this.on('diagram.destroy', function() {
        this.get('moddle').ids.clear();
    }, this);
}
function BaseViewer(options) {
    options = assign({}, DEFAULT_OPTIONS, options);
    this._moddle = this._createModdle(options);
    this._container = this._createContainer(options);
    addProjectLogo(this._container);
    this._init(this._container, this._moddle, options);
}
BaseViewer.prototype._init = function(container, moddle, options) {
    // getModules() 返回 BaseViewer.prototype._modules = []
    var baseModules = options.modules || this.getModules(),
        additionalModules = options.additionalModules || [],
        staticModules = [{ bpmnjs: [ 'value', this ], moddle: [ 'value', moddle ] }];

    var diagramModules = [].concat(staticModules, baseModules, additionalModules);
    var diagramOptions = assign(omit(options, [ 'additionalModules' ]), {
        canvas: assign({}, options.canvas, { container: container }),
        modules: diagramModules
    });
    // invoke diagram constructor
    Diagram.call(this, diagramOptions);

    if (options && options.container) {
        this.attachTo(options.container);
    }
};
function Diagram(options, injector) {
    this.injector = injector = injector || createInjector(options);
    this.get = injector.get;
    this.invoke = injector.invoke;
    this.get('eventBus').fire('diagram.init');
}
```

在 `new Diagram(diagramOptions)` 的过程中，主要是通过 `createInjector(options)` 实例化 `Injector` 与 `additionalModules` 中配置的插件实例，并触发 `diagram.init` 事件表示画布实例化结束。

> `createInjector(options)` 过程中会将 `diagramOptions` 全部作为 `{ config: [ 'value', diagramOptions ] }` 保存在一个 `configModule` 模块中，并添加 `Diagram` 的基础插件包 `CoreModule`，之后执行 `injector = new Injector(modules)` 与 `injector.init()`

### 3.1 Injector

上一章我们讲过，Bpmn.js 继承自 Diagram.js，采用依赖注入的形式来链接各个插件之间的引用关系。

这个进行依赖注入的注入器 `Injector`(源码见 [didi](https://github.com/nikku/didi)), 在进行 `new Modeler(options)` 时，便会进行一次实例化，对 `options` 内部的属性进行解析与实例化（部分），并挂载到 `Injector` 实例下的 `_instances` 上。并且在 `Modeler` 的实例上创建两个属性：`get` 和 `invoke`。

`get` 方法指向 `Injector` 实例的 `get` 方法，可以通过 `modeler.get('xxx')` 来获取对应的插件实例。

`invoke` 方法指向 `Injector` 实例的 `invoke(func, context, locals)` 方法，作用向插件系统中注入新插件和依赖的方法，会根据 `locals` 或者 `func.$inject` 来声明该函数对应的依赖关系。

> 所以源码中很多需要调用其他模块实例的构造函数，末尾都会有一个 `$inject` 静态属性。

**首先，`Injector` 是一个构造函数**

`Injector` 接收两个参数：`modules`, `parent`。 其中 `parent` 是可选参数，如果为空，会默认生成一个带有 `get()` 方法的对象参与后面的逻辑。

在 `new Injector(modules, parent)` 时，首先执行：

```typescript
// 省略了 parent 判断部分
const providers = this._providers = Object.create(parent._providers || null);
const instances = this._instances = Object.create(null);

const self = instances.injector = this;
```

这里会在 `Injector` 的实例上挂载 `_providers` 属性，保存各个 `additionalModule` 的配置； 挂载 `_instances` 属性，保存各个 `additionalModule` 对应配置项生成的函数、实例、或者配置常量；挂载 `injector` 属性指向当前实例本身，用来提供给 `additionalMudole` 的配置实例化时调用。

随后执行：

```typescript
this.get = get;
this.invoke = invoke;
this.instantiate = instantiate;
this.createChild = createChild;

// setup
this.init = bootstrap(modules);
```

这里执行 `bootstrap(modules)` 方法，遍历传入的 `modules` 插件模块配置项，并进行扁平化处理 `resolveDependencies`；然后遍历扁平化结果，执行模块的加载和初始化 `loadModule`；最后返回一个闭包函数，用来进行模块实例初始化。

```typescript
function bootstrap(moduleDefinitions) {
    var initializers = moduleDefinitions
        .reduce(resolveDependencies, [])
        .map(loadModule);
    
    var initialized = false;

    return function() {
        if (initialized) return;
        initialized = true;
        initializers.forEach(function(initializer) {
            return initializer();
        });
    };
}
```

在 `moduleDefinitions.reduce(resolveDependencies, [])` 过程中，如果某一遍历项存在 `__depends__` , 则会对 `__depends__` 数组再次进行遍历操作。如果当前项已经存在新的数组中，则直接返回。

```typescript
function resolveDependencies(moduleDefinitions: ModuleDefinition[], moduleDefinition: ModuleDefinition): ModuleDefinition[] {
    if (moduleDefinitions.indexOf(moduleDefinition) !== -1) {
        return moduleDefinitions;
    }
    moduleDefinitions = (moduleDefinition.__depends__ || []).reduce(resolveDependencies, moduleDefinitions);
    if (moduleDefinitions.indexOf(moduleDefinition) !== -1) {
        return moduleDefinitions;
    }
    return moduleDefinitions.concat(moduleDefinition);
}
```

在 `loadModule` 时，会区分两种情况处理：`private module` 和 `normal module`，但是最终返回的都是一个 **函数**，用来获取 `module` 插件实例或者函数等（这里主要处理每个插件模块中配置的 `__init__` 属性，保存到闭包函数的遍历 `initializers` 中，供后面 `injector.init()` 调用）。

> `private module` 私有模块通过某个模块的 `moduleDefinition.__exports__` 是否有值来区分，目前 `diagram.js` 和 `bpmn.js` 都没有私有模块。所以这里暂时不做讲解。

```typescript
type ProviderType = 'value' | 'factory' | 'type'
type FactoryMap<T> = {
    factory<T>(func: (...args: unknown[]) => T, context: InjectionContext, locals: LocalsMap): T
    type<T>(Type: T): T
    value(T): T
}
type ProviderType<T> = [Function, T | Function, ProviderType]

function loadModule(moduleDefinition: ModuleDefinition): Function {
    Object.keys(moduleDefinition).forEach(function(key: string) {
        // 区分模块依赖定义字段
        if (key === '__init__' || key === '__depends__') return;
        
        if (moduleDefinition[key][2] === 'private') {
            providers[key] = moduleDefinition[key];
            return;
        }
        
        const type: string = moduleDefinition[key][0];
        const value: Object | Function = moduleDefinition[key][1];
        
        // arrayUnwrap 主要是判断模块定义类型，如果是 'value' 或者 'factory'，则直接返回对应函数
        // 否则判断第二个参数类型，如果是数组格式，则对其按照模块标准定义格式重新进行格式化再返回格式化后的函数
        providers[key] = [ factoryMap[type], arrayUnwrap(type, value), type ];
    });
    
    // self 在 Injector() 已经定义，指向 injector 实例
    return createInitializer(moduleDefinition, self);
}

// 这里是根据模块定义，来定义初始化时需要执行实例化的模块，以及该模块的实例获取方式
function createInitializer(moduleDefinition: ModuleDefinition, injector: Injector): Function {
    var initializers = moduleDefinition.__init__ || [];
    return function() {
        initializers.forEach(function(initializer) {
            try {
                if (typeof initializer === 'string') {
                    injector.get(initializer);
                } else {
                    injector.invoke(initializer);
                }
            } catch (error) {
                if (typeof AggregateError !== 'undefined') {
                    throw new AggregateError([ error ], 'Failed to initialize!');
                }
                throw new Error('Failed to initialize! ' + error.message);
            }
        });
    };
}
```

直到这里为止，都依然在 `Injector` 的实例化过程中，在 `injector` 实例上，目前 `_instances` 属性也只有在初始化时挂载的 `injector` 本身。但 `_providers` 属性上已经包含了所有的模块定义。

并且为 `init` 定义了一个模块实例的初始化函数，内部使用 `initialized` 变量（闭包）避免二次初始化。

### 3.2 Diagram

在 3.1 Injector 已经简单解析了 `new Injector()` 的过程，这时已经对所有的 `modules` 进行了处理，但是插件实例依然还是空值。

所以在 `new Diagram()` 中，会继续调用 `injector.init()` 执行模块实例的处理。这里会通过 `new Injector()` 时 `bootstrap` 方法返回的函数，去遍历闭包里面的 `initializers` 数组，进行初始化 `initializer()`。

```typescript
initializers = moduleDefinition.__init__ || [];
initializers.forEach(function(initializer) {
    if (typeof initializer === 'string') {
        injector.get(initializer);
    } else {
        injector.invoke(initializer);
    }
})
```

因为 `initializers` 保存的是模块定义中的 `__init__` 属性，在 `bpmn.js` 和 `diagram.js` 中基本都是字符串数组，所以都是通过 `injector.get(name, strict)` 来进行实例化。该方法主要是 `name` 参数，查找 `injector._instance` 是否有该名称对应的实例；否则调用 `injector._providers[name]` 进行实例化，保存实例化结果并返回；如果都不存在，则调用 `new Injector()` 时传入的 `parent` 参数的 `get` 方法。简易代码如下：

```typescript
function get(name, strict) {
    // 这里是用来处理类似 config.canvas 这类配置项数据
    if (!providers[name] && name.indexOf('.') !== -1) {
        var parts = name.split('.');
        var pivot = get(parts.shift());
        while (parts.length) {
            pivot = pivot[parts.shift()];
        }
        return pivot;
    }
    if (hasOwnProp(instances, name)) {
        return instances[name];
    }
    if (hasOwnProp(providers, name)) {
        if (currentlyResolving.indexOf(name) !== -1) {
            currentlyResolving.push(name);
            throw error('Cannot resolve circular dependency!');
        }
        currentlyResolving.push(name);
        instances[name] = providers[name][0](providers[name][1]);
        currentlyResolving.pop();
        return instances[name];
    }
    return parent.get(name, strict);
}
```

上文我们说到，在 `new Diagram()` 时会在传递的 `diagramOptions` 参数中添加一个 `configModule` 和 基础插件依赖 `coreModule`。这里的 `coreModule` 主要包含以下模块：

1. `canvas`：主要的画布区域，负责创建和管理图层、元素 class 标记管理、创建删除 svg 元素、查找根节点等等
2. `elementRegistry`：元素 id 与 元素图形、实例之间的关系表，用于元素查找等
3. `elementFactory`：基础的元素实例构造函数，管理基础的几个元素类型构造函数，用来创建新的元素实例
4. `eventBus`：事件总线模块，通过发布订阅模式，联通各个模块之间的处理逻辑
5. `graphicsFactory`：负责 svg 元素创建和删除

并且依赖了 `defaultRenderer` 和 `styles` 模块。

1. `defaultRenderer`：默认的 svg 渲染函数，继承自抽象构造函数 `BaseRenderer`，用来校验和绘制 svg 元素，并设置了三种默认样式 `CONNECTION_STYLE`、`SHAPE_STYLE`、`FRAME_STYLE`
2. `styles`：样式处理函数，用来合并元素的颜色配置

**在以上步骤都完成之后，我们的画布也就基本上初始化结束。但是，`diagram.js`的内容远远不止于此！**

以上几个模块，主要是作为 `diagram.js` 根据默认配置进行初始化时会依赖的核心插件模块。`diagram.js` 还提供了一个 `features` 目录，存放了 21 个扩展插件模块，包含对齐、属性更新、元素替换、上下文菜单等等，这部分内容稍后会进行部分讲解。下面就到了最激动人心的 `bpmn.js` 了。

### 3.3 Bpmn BaseViewer

在第三节开头，我们说过在 `new Diagram()` 之前会进行配置合并、`_moddle`、`_container` 属性创建等一系列操作，都是在 `BaseViewer` 这里完成的。 `BaseViewer` 的 `typescript` 声明大致如下：

```typescript
declare class BaseViewer extends Diagram {
    constructor(options?: ViewerOptions<Element>)
    importXML(xml: string): Promise<DoneCallbackOpt>
    open(diagram: string): Promise<DoneCallbackOpt>
    saveXML(options?: WriterOptions): Promise<DoneCallbackOpt>
    saveSVG(options?: WriterOptions): Promise<DoneCallbackOpt>
    clear(): void
    destroy(): void
    on<T extends BPMNEvent, P extends InternalEvent>(
      event: T,
      priority: number | BPMNEventCallback<P>,
      callback?: EventCallback<T, any>,
      that?: this
    ): void
    off<T extends BPMNEvent, P extends InternalEvent>(
      events: T | T[],
      callback?: BPMNEventCallback<P>
    ): void
    attachTo<T extends Element>(parentNode: string | T): void
    detach(): void
    importDefinitions(): ModdleElement
    getDefinitions(): ModdleElement
    protected _setDefinitions(definitions: ModdleElement): void
    protected _modules: ModuleDefinition[]
}
```

该函数主要是创建一个只包含导入导出、挂载销毁、解析规则定义等基础功能 `BPMN 2.0` 流程图查看器，不能移动和缩放，也不能按照不同元素类型绘制 svg 图形来显示，所以这个构造函数一般也不会使用，除非我们需要按照其他业务需求定制查看器。

`BaseViewer` 提供了 `baseViewer.on()` 、 `baseViewer.off` 和 `baseViewer._emit` 来创建、销毁和触发监听事件的方法，内部也是调用的 `injector.get('eventBus')` 来实现的，所以 `modeler.on()`、 `baseViewer.on()`、 `injector.get('eventBus').on()`、 `modeler.get('eventBus').on()` 最终效果与显示逻辑都是一致的，我们按照习惯任意选择一种即可。

同理， `baseViewer.off` 与 `baseViewer._emit` 也是一样。

### 3.4 Bpmn BaseModeler

`BaseModeler` 实际上与 `BaseViewer` 差异不是很大，只是在初始化时增加了两个监听事件，并在原型上添加了两个方法( 有一个是重写覆盖 )。

```typescript
declare class BaseModeler extends BaseViewer {
    constructor(options?: ViewerOptions<Element>)
    _createModdle(options: Object): BpmnModdle
    _collectIds(definitions: ModdleElement, elementsById: Object): void
}
```

### 3.5 Bpmn Modeler

`Modeler` 在 `BaseModeler` 的基础上，添加了一个 `createDiagram()` 方法，用来创建一个默认的 BPMN 2.0 流程图（默认 id 为 `Process_1`，并包含一个 id 为 `StartEvent_1` 的开始事件节点）。

在原型上添加了以下几个属性：

1. `Viewer`：指向 `bpmn.js` 的 `Viewer` 构造函数地址
2. `NavigatedViewer`：指向 `bpmn.js` 的 `NavigatedViewer` 构造函数地址
3. `_interactionModules`：键盘、鼠标等互动模块，包含 `KeyboardMoveModule, MoveCanvasModule, TouchModule, ZoomScrollModule`，均来自 `diagram-js/lib/features`
4. `_modelingModules`：核心的建模工具模块，包含用来更新元素实例属性的 `ModelingModule`、元素上下文菜单 `ContextPadModule`、元素选择器侧边栏 `PaletteModule` 等
5. `_modules`：合并了 `Viewer.prototype._modules`、`_interactionModules`、`_modelingModules` 之后的插件模块配置数组

> `Viewer.prototype._modules` 则包含了 `bpmn.js` 相关的元素绘制、元素选择、图层管理等相关模块，也包含元素实例和画布 svg 元素关联的模块。

因为 `Modeler` 构造函数对 `_modules` 进行了重定义，引入完整的建模扩展插件（模块），所以在使用时，我们仅需要指定 `container` 配置项，即可得到一个完整的建模器。

![modeler.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0df35d7a19cd44f0bd10875e8fddb5f8~tplv-k3u1fbpfcp-watermark.image?)

> 当然，由于没有引入流程引擎对应的解析文件与 `panel` 属性侧边栏，所以这种方式实际作用不是很大。

### 3.6 Camunda Properties Panel

在 `bpmn.io` 的团队介绍中，可以得知该团队主要成员均来自 `camunda` 的团队，所以官方也针对 `camunda` 流程引擎开发了对应的 `Properties Panel` 插件，主要用来编辑一些不能体现在可视界面上的特殊属性（也包含通用属性，类似 Id、name、documentation 等）。

> 🚩🚩 在 `bpmn-js-properties-Panel` 的 1.x 版本进行了颠覆性的更新，不仅重写了 UI 界面，1.x 版本之前的部分 API 和属性编辑栏构造函数都进行了重写，并将属性栏 DOM 构建与更新方式改写为 `React JSX Hooks` 与 `Components` 的形式，迁移到了 [@bpmn-io/properties-panel](https://github.com/bpmn-io/properties-panel) 仓库中。

##### 1. 基础属性侧边栏

使用侧边栏的方式与引入一个 `additionalModule` 一样，代码如下：

```typescript
import Modeler from 'bpmn-js/lib/Modeler';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';

import 'bpmn-js-properties-panel/dist/assets/properties-panel.css';

const modeler = new Modeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule
  ]
});
```

这样我们就已经引入了一个最基础的属性侧边栏模块。当然这里需要注意以下几点：

1. 必须引入 `properties-panel.css` 样式文件
2. `new Modeler()` 时，必须传入配置项 `propertiesPanel`，并设置 `parent` 属性，用来指定侧边栏挂载的 DOM 节点
3. `additionalModules` 需要同时引入 `BpmnPropertiesPanelModule` 与 `BpmnPropertiesProviderModule` ，否则不能正常使用。

这里对第二、三点大致解释一下：

在第 3 节的开头，我们说到过在进行实例化的时候，会把 `new Modeler(options)` 时的 `options` 作为一个 `configModule` 注入到依赖系统里面。其他 `module` 可以通过声明构造函数属性 `Constructor.$inject = ['config']` 或者 `Constructor.$inject = ['config.xxxModule']` 来读取配置项数据。

而 `BpmnPropertiesPanelModule` 作为属性侧边栏的 `DOM` 构造器，主要用来渲染侧边栏基础界面，并在流程创建完成或者元素属性更新之后，通过 `additionalModules` 内引用的 `PropertiesProviderModules` 来创建具体的属性编辑表单项。

`BpmnPropertiesProviderModule` 作为 `bpmn.js` 本身依赖的基础属性构造器，主要包含以下部分：

1. `Id`, `Name` 和 `Documentation` 属性，以及 `Process` 节点或者具有 `processRef` 定义的 `Participant` 节点特有的 `isExecutable` 属性
2. 具有 “特殊事件定义” 的事件节点(例如 `StartEvent`, `EndEvent`, `BoundaryEvent` 节点等)，可以配置的 `Message`, `Error`, `Singal` 等
3. 具有 “多实例定义” 的任务类型节点，可以配置的 `MultiInstance` 属性(又分为 `LoopCardinality` 和 `CompletionCondition`)

##### 2. camunda 流程引擎关联的属性侧边栏

基础属性侧边栏可配置的属性非常少，基本上不能满足一个业务流程的配置需求。所以 camunda 的团队针对自身的流程引擎对属性侧边栏进行了补充。引用代码如下：

```typescript
import Modeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  CamundaPlatformPropertiesProviderModule
} from 'bpmn-js-properties-panel';

import CamundaExtensionModule from 'camunda-bpmn-moddle/lib'

import camundaModdleDescriptors from 'camunda-bpmn-moddle/resources/camunda';

const modeler = new Modeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    CamundaPlatformPropertiesProviderModule,
    CamundaExtensionModule
  ],
  moddleExtensions: {
    camunda: camundaModdleDescriptors
  }
});
```

这里与引入基础属性侧边栏相比，增加了一下几点配置项：

1. `additionalModules` 增加 `CamundaExtensionModule`(扩展校验模块，用来校验复制粘贴、属性移除等) 和 `CamundaPlatformPropertiesProviderModule`(提供异步控制属性、监听器配置、扩展属性、条件配置等)
2. `moddleExtensions` 配置属性 `camunda: camundaModdleDescriptors`，用来解析与识别 `camunda` 流程引擎配置的特殊业务属性以及属性关联格式等。

> 具体的 `moddleExtension` 配置可以查看 [Bpmn-js自定义描述文件说明-掘金](https://juejin.cn/post/6912331982701592590)

#### `BpmnPropertiesPanelModule` 与 `PropertiesProviderModule`

上文我们已经讲过，`BpmnPropertiesPanelModule` 主要用于构建基础的属性侧边栏面板，并通过 `PropertiesProviderModule` 来生成对应的属性表单项。

```typescript
declare class BpmnPropertiesPanelRenderer extends ModuleConstructor {
    constructor(config: Object, injector: Injector, eventBus: EventBus)
    _eventBus: EventBus
    _injector: Injector
    _layoutConfig: undefined | Object
    _descriptionConfig: undefined | Object
    _container: Element

    attachTo(container: Element): void
    detach(): void
    registerProvider(priority: number | PropertiesProvider, provider?: PropertiesProvider): void

    _getProviders(): PropertiesProvider[]
    _render(): void
    _destroy(): void
}
```

这里的 `BpmnPropertiesPanelRenderer` 即是 `BpmnPropertiesPanelModule`，只是在 ``















