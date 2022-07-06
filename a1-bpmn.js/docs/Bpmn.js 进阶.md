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

在进行 `new Modeler()` 时，首先会与 bpmn.js 的 `Modeler` 默认配置进行合并，之后创建一个 `BpmnModdle(moddleExtensions)` 实例作为 `modeler._moddle` 的属性值，该模块主要用来进行 xml 字符串的解析和属性转换，也可以用来**注册新的解析规则**和**创建对应的元素实例**。

之后创建一个 DOM 节点作为画布区域，挂载到 `modeler._container` 上，并添加 bpmn-io 的 logo。

然后，会根据 `additionalModules` 和默认的 `{ bpmnjs: [ 'value', this ], moddle: [ 'value', moddle ] }` 合并，再合并 `canvas` 配置，调用 `Diagram` 进行后续逻辑，结束后再将 `_container` 挂载到传入的 `container` 对应的 DOM 节点上。

从 `new Modeler()` 到 `new Diagram()` 主要过程如下：

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

> 这里是通过遍历 `moduleDefinition` 来更新 `_providers` 对象，所以后面我们才可以用同名模块来覆盖 `bpmn.js` 原有的模块

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

## 4. Properties Panel

> 🚩🚩 在 `bpmn-js-properties-Panel` 的 1.x 版本进行了颠覆性的更新，不仅重写了 UI 界面，1.x 版本之前的部分 API 和属性编辑栏构造函数都进行了重写，并将属性栏 DOM 构建与更新方式改写为 `React JSX Hooks` 与 `Components` 的形式，迁移到了 [@bpmn-io/properties-panel](https://github.com/bpmn-io/properties-panel) 仓库中。

### 4.1 Basic Properties Panel

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

### 4.2 `BpmnPropertiesPanelModule`, `BpmnPropertiesPanel` 与 `PropertiesProviderModule`

#### 4.2.1 `BpmnPropertiesPanelModule`

上文我们已经讲过，`BpmnPropertiesPanelModule` 主要用于构建基础的属性侧边栏面板，并通过 `PropertiesProviderModule` 来生成对应的属性表单项。

```typescript
declare class BpmnPropertiesPanelModule extends ModuleConstructor {
    constructor(config: Object, injector: Injector, eventBus: EventBus)
    _eventBus: EventBus
    _injector: Injector
    _layoutConfig: undefined | Object
    _descriptionConfig: undefined | Object
    _container: Element

    attachTo(container: Element): void
    detach(): void
    registerProvider(priority: number | PropertiesProvider, provider?: PropertiesProvider): void

    _getProviders(element?: Base): PropertiesProvider[]
    _render(element?: Base): void
    _destroy(): void
}
```

`BpmnPropertiesPanelModule` 在初始化时，会监听三个事件：

1. `diagram.init`：在画布初始化时，调用 `attach` 方法将自己的 `_container` 面板节点挂载到 `config.propertiesPenal.parent` 上
2. `diagram.destroy`：在画布销毁时，将面板节点从 `_container.parentNode` 移除
3. `root.added`：在根节点创建完成后，调用 `_render()` 方法，创建一个 `BpmnPropertiesPanel` 组件并渲染

#### 4.2.2 `BpmnPropertiesPanel` 组件

`BpmnPropertiesPanel` 组件的写法与 `React Hooks Component` 的写法一样，主要实现一下几个方面的功能：

1. 通过 `EventBus` 实例来设置 `selection.changed`, `elements.changed`, `propertiesPanel.providersChanged`, `elementTemplates.changed`, `root.added` 几个事件的监听函数，根据选中元素变化来更新当前状态。
2. 通过 `BpmnPropertiesPanelModule._getProviders()` 获取已注册的 `PropertiesProviderModules` 数组，遍历数组，调用 `PropertiesProviderModule.getGroups(element)` 来获取当前元素对应的属性配置项分组，用于后面的组件渲染。

```javascript
const eventBus = injector.get('eventBus');
const [ state, setState ] = useState({ selectedElement: element });
const selectedElement = state.selectedElement;

// 1
useEffect(() => {
    const onSelectionChanged = (e) => {
        const { newSelection = [] } = e;
        if (newSelection.length > 1) {
            return _update(newSelection);
        }
        const newElement = newSelection[0];
        const rootElement = canvas.getRootElement();
        if (isImplicitRoot(rootElement)) {
            return;
        }
        _update(newElement || rootElement);
    };
    eventBus.on('selection.changed', onSelectionChanged);

    return () => {
        eventBus.off('selection.changed', onSelectionChanged);
    };
}, [])

useEffect(() => {
    const onElementsChanged = (e) => {
        const elements = e.elements;
        const updatedElement = findElement(elements, selectedElement);
        if (updatedElement && elementExists(updatedElement, elementRegistry)) {
            _update(updatedElement);
        }
    };
    eventBus.on('elements.changed', onElementsChanged);
    return () => {
        eventBus.off('elements.changed', onElementsChanged);
    };
}, [selectedElement])

// 省略了 useEffect 部分，详细内容见源码 https://github.com/bpmn-io/bpmn-js-properties-panel/blob/master/src/render/BpmnPropertiesPanel.js
const onRootAdded = (e) => {
    const element = e.element;
    _update(element);
};
eventBus.on('root.added', onRootAdded);

const onProvidersChanged = () => {
    _update(selectedElement);
};
eventBus.on('propertiesPanel.providersChanged', onProvidersChanged);

const onTemplatesChanged = () => {
    _update(selectedElement);
};
eventBus.on('elementTemplates.changed', onTemplatesChanged);

// 2
const providers = getProviders(selectedElement);
const groups = useMemo(() => {
    return reduce(providers, function(groups, provider) {
        if (isArray(selectedElement)) return [];
        const updater = provider.getGroups(selectedElement);
        return updater(groups);
    }, []);
}, [ providers, selectedElement ]);
```

#### 4.2.3 `PropertiesProviderModule`

该模块(或者说这类模块)主要用来注册元素的属性配置项，依赖 `BpmnPropertiesPanelModule` 组件，通过实例化时调用 `BpmnPropertiesPanelModule.registerProvider(this)` 来将自身注册到属性侧边栏面板的构造器当中。当然，通过 `BpmnPropertiesPanel` 组件的内部逻辑，我们知道每个 `PropertiesProviderModule` 还需要提供一个 `getGroups` 方法，用来获取当前元素对应的属性配置项分组。

```typescript
// 基础的 Provider ts 定义
declare class PropertiesProviderModule {
    constructor(propertiesPanel: BpmnPropertiesPanelModule)

    getGroups(element: Base): () => Group[]
}

// 下面是 bpmn 基础属性栏的 PropertiesProviderModule 定义
function getGroups$1(element) {
    const groups = [
        GeneralGroup(element),
        DocumentationGroup(element),
        CompensationGroup(element),
        ErrorGroup(element),
        LinkGroup(element),
        MessageGroup(element),
        MultiInstanceGroup(element),
        SignalGroup(element),
        EscalationGroup(element),
        TimerGroup(element)
    ];
    return groups.filter(group => group !== null);
}
export default class BpmnPropertiesProvider {
    constructor(propertiesPanel) {
        propertiesPanel.registerProvider(this);
    }
    getGroups(element) {
        return (groups) => {
            groups = groups.concat(getGroups$1(element));
            return groups;
        };
    }
}
BpmnPropertiesProvider.$inject = [ 'propertiesPanel' ];
```

> 这里需要注意的是 `getGroups` 最终返回的是一个函数，通过传入参数 `groups` 来合并当前 `PropertiesProviderModule` 的属性分组定义

### 4.3 Camunda Properties Panel

在 `bpmn.io` 的团队介绍中，可以得知该团队主要成员均来自 `camunda` 的团队，所以官方也针对 `camunda` 流程引擎开发了对应的 `Properties Panel` 插件，主要用来编辑一些不能体现在可视界面上的特殊属性（也包含通用属性，类似 Id、name、documentation 等）。

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

### 4.4 Custom Properties Panel

虽然 `camunda` 官方提供了一个属性编辑面板，但是内部对属性的更新和读取都与 `camunda` 流程引擎做了强关联，所以在没有使用 `camunda` 流程引擎的时候，如何去更新元素属性就成了一个亟需解决的问题（特别是国内使用率最多的除了国产流程引擎外就是 `flowable` 和 `activiti`）。

对于这个问题，`bpmn-io` 官方也编写了一个示例项目[properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/master/properties-panel-extension)，对如何扩展属性侧边栏进行了简单说明，这里我们也以这个例子进行讲解。

#### 4.4.1 Properties Moddle Extension

首先，在创建自定义的属性编辑面板之前，需要先定义相关的自定义属性，这里我们以 `flowable` 流程引擎对应的属性为例。

第一步：定义相关的属性

```json
{
  "name": "Flowable",
  "uri": "http://flowable.org/bpmn",
  "prefix": "flowable",
  "xml": {
    "tagAlias": "lowerCase"
  },
  "associations": [],
  "types": [
    {
      "name": "JobPriorized",
      "isAbstract": true,
      "extends": ["bpmn:Process"],
      "properties": [
        {
          "name": "jobPriority",
          "isAttr": true,
          "type": "String"
        }
      ]
    },
    {
      "name": "Process",
      "isAbstract": true,
      "extends": ["bpmn:Process"],
      "properties": [
        {
          "name": "candidateStarterGroups",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "candidateStarterUsers",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "versionTag",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "historyTimeToLive",
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "isStartableInTasklist",
          "isAttr": true,
          "type": "Boolean",
          "default": true
        }
      ]
    }
  ]
}
```

在这个 json 文件里面，我们对 `Process` 节点进行了扩展，增加了 `versionTag`, `jobPriority` 等属性。

#### 4.4.2 `CustomPropertiesProviderModule`

第二步：创建属性对应的 `PropertiesProviderModule`

```typescript
import { is } from 'bpmn-js/lib/util/ModelUtil';

class FlowablePropertiesProvider {
    constructor(propertiesPanel: BpmnPropertiesPanelModule) {
        propertiesPanel.registerProvider(this)
    }
    getGroups(element) {
        return function (groups) {
            if (is(element, 'bpmn:Process')) {
                // 这里只用 versionTag 属性的配置项作为示例
                const group = [VersionTag(element)]
                
                groups.concat(group)
            }
            return groups
        }
    }
}
FlowablePropertiesProvider.$inject = ['propertiesPanel']

export default FlowablePropertiesProvider
```

#### 4.4.3 `CustomPropertiesGroup`

第三步：实现自定义属性栏分组与 `VsersionTag` 属性编辑组件

```typescript
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';

// 创建 VersionTag 的属性编辑栏入口 Entry
function VersionTag(props) {
    const { element } = props;
    
    const commandStack = useService('commandStack');
    const modeling = useService('modeling');
    const debounce = useService('debounceInput');
    
    const processBo = getBusinessObject(element);
    
    const getValue = () => processBo.get('flowable:versionTag') || ''
    
    const setValue = (value) => {
        // 写法 1
        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: processBo,
            properties: { 'flowable:versionTag': value }
        });
        // 写法 2
        modeling.updateModdleProperties(element, processBo, { 'flowable:versionTag': value })
    };
    
    // 返回一个属性编辑组件
    return TextFieldEntry({
        element,
        id: 'versionTag',
        label: 'Version Tag',
        getValue,
        setValue,
        debounce
    });
}

// 返回获取自定义属性面板分组的函数
export default function (element) {
    return [
        {
            id: 'custom version',
            element,
            component: VersionTag,
            isEdited: isTextFieldEntryEdited
        }
    ]
}
```

#### 4.4.4 `Use CustomPropertiesProviderModule`

第四步：引入自定义属性构造器 `FlowablePropertiesProvider`

```typescript
// 省略 modeler 部分引入

// 引入属性声明文件
import flowableDescriptor from 'xxx/flowable.json'

// 引入自定义属性编辑组件的构造函数
import FlowablePropertiesProvider from 'xxx/FlowablePropertiesProvider.ts'

// 组成符合 ModuleDefinition 格式的对应 (可以像官方实例那样放到一个 index 文件内部)
const FlowablePropertiesProviderModule = {
    __init__: [ 'flowablePropertiesProvider' ],
    flowablePropertiesProvider: [ 'type', FlowablePropertiesProvider ]
}

const bpmnModeler = new BpmnModeler({
    container: '#js-canvas',
    propertiesPanel: {
        parent: '#js-properties-panel'
    },
    additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        FlowablePropertiesProviderModule
    ],
    moddleExtensions: {
        flowable: flowableDescriptor
    }
});
```

## 5. Toolbar

在画布与属性面板都创建好之后，我们就得到了一个完整的流程图编辑器了。

![default designer.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3d8510c0996d4f5e85423f86bab15517~tplv-k3u1fbpfcp-watermark.image?)

但是，这个模式下的编辑器没有绑定键盘快捷键，也没有导入导出的按钮和入口，并且也不能支持一键对齐等等功能。所以我们可以在此基础上，实现一个工具栏，来优化用户体验。

### 5.1 Import And Export

#### 导入

首先，我们先实现文件导入的功能。利用 `Modeler` 实例本身的 `importXML(xmlString)` 的方法，可以很简单的完成导入，只需要创建一个 `input` 和一个 `button` 即可。

通过 `button` 的点击事件来模拟文件选择 `input` 的点击来触发文件选择，在确认文件选取之后初始化一个 `FileReader` 来读取数据并渲染。

> 这里使用的组件库是 naive ui

```tsx
import { defineComponent, ref } from 'vue'
import { NButton } from 'naive-ui'
import modeler from '@/store/modeler'

const Imports = defineComponent({
  name: 'Imports',
  setup() {
    const modelerStore = modeler()
    const importRef = ref<HTMLInputElement | null>(null)

    const openImportWindow = () => {
      importRef.value && importRef.value.click()
    }

    const changeImportFile = () => {
      if (importRef.value && importRef.value.files) {
        const file = importRef.value.files[0]
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = function () {
          const xmlStr = this.result
          modelerStore.getModeler!.importXML(xmlStr as string)
        }
      }
    }

    return () => (
      <span>
        <NButton type="info" secondary onClick={openImportWindow}>
          打开文件
        </NButton>
        <input
          type="file"
          ref={importRef}
          style="display: none"
          accept=".xml,.bpmn"
          onChange={changeImportFile}
        ></input>
      </span>
    )
  }
})

export default Imports

```

#### 导出

至于文件导出的功能，官方在 `BaseViewer` 的原型上就提供了 `saveXML` 和 `saveSVG` 这两个方法，分别用来获取 `xml` 字符串与 `svg` 渲染结果。

```tsx
import { defineComponent } from 'vue'
import { NButton, NPopover } from 'naive-ui'
import { downloadFile, setEncoded } from '@/utils/files'
import modeler from '@/store/modeler'

const Exports = defineComponent({
  name: 'Exports',
  setup() {
    const moderlerStore = modeler()
    // 下载流程图到本地
    /**
     * @param {string} type
     * @param {*} name
     */
    const downloadProcess = async (type: string, name = 'diagram') => {
      try {
        const modeler = moderlerStore.getModeler
        // 按需要类型创建文件并下载
        if (type === 'xml') {
          const { err, xml } = await modeler!.saveXML()
          // 读取异常时抛出异常
          if (err) {
            console.error(`[Process Designer Warn ]: ${err.message || err}`)
          }
          const { href, filename } = setEncoded(type.toUpperCase(), name, xml!)
          downloadFile(href, filename)
        } else {
          const { err, svg } = await modeler!.saveSVG()
          // 读取异常时抛出异常
          if (err) {
            return console.error(err)
          }
          const { href, filename } = setEncoded('SVG', name, svg!)
          downloadFile(href, filename)
        }
      } catch (e: any) {
        console.error(`[Process Designer Warn ]: ${e.message || e}`)
      }
    }

    const downloadProcessAsXml = () => {
      downloadProcess('xml')
    }
    const downloadProcessAsSvg = () => {
      downloadProcess('svg')
    }

    return () => (
      <NPopover
        v-slots={{
          trigger: () => (
            <NButton type="info" secondary>
              导出为...
            </NButton>
          ),
          default: () => (
            <div class="button-list_column">
              <NButton type="info" onClick={downloadProcessAsXml}>
                导出为XML
              </NButton>
              <NButton type="info" onClick={downloadProcessAsSvg}>
                导出为SVG
              </NButton>
            </div>
          )
        }}
      ></NPopover>
    )
  }
})

export default Exports
```

```typescript
// 根据所需类型进行转码并返回下载地址
export function setEncoded(type: string, filename: string, data: string) {
  const encodedData: string = encodeURIComponent(data)
  return {
    filename: `${filename}.${type.toLowerCase()}`,
    href: `data:application/${
      type === 'svg' ? 'text/xml' : 'bpmn20-xml'
    };charset=UTF-8,${encodedData}`,
    data: data
  }
}

// 文件下载方法
export function downloadFile(href: string, filename: string) {
  if (href && filename) {
    const a: HTMLAnchorElement = document.createElement('a')
    a.download = filename //指定下载的文件名
    a.href = href //  URL对象
    a.click() // 模拟点击
    URL.revokeObjectURL(a.href) // 释放URL 对象
  }
}
```

### 5.2 Canvas Zoom

因为没有绑定键盘事件，所以当前情况下想通过键盘和鼠标滚轮来控制画布缩放层级也不行。

但是 `diagram.js` 的核心模块 `Canvas`，就提供了画布的相关控制方法，我们可以通过 `Canvas` 的实例来实现对画布的控制。

```tsx
import { defineComponent, ref } from 'vue'
import { NButton, NButtonGroup, NPopover } from 'naive-ui'
import LucideIcon from '@/components/common/LucideIcon.vue'
import EventEmitter from '@/utils/EventEmitter'
import type Modeler from 'bpmn-js/lib/Modeler'
import type Canvas from 'diagram-js/lib/core/Canvas'
import { CanvasEvent } from 'diagram-js/lib/core/EventBus'

const Scales = defineComponent({
  name: 'Scales',
  setup() {
    const currentScale = ref(1)
    let canvas: Canvas | null = null

    EventEmitter.on('modeler-init', (modeler: Modeler) => {
      canvas = modeler.get<Canvas>('canvas')
      currentScale.value = canvas.zoom()
      modeler.on('canvas.viewbox.changed', ({ viewbox }: CanvasEvent<any>) => {
        currentScale.value = viewbox.scale
      })
    })

    const zoomOut = (newScale?: number) => {
      currentScale.value = newScale || Math.floor(currentScale.value * 100 - 0.1 * 100) / 100
      zoomReset(currentScale.value)
    }

    const zoomIn = (newScale?: number) => {
      currentScale.value = newScale || Math.floor(currentScale.value * 100 + 0.1 * 100) / 100
      zoomReset(currentScale.value)
    }

    const zoomReset = (newScale: number | string) => {
      canvas && canvas.zoom(newScale, newScale === 'fit-viewport' ? undefined : { x: 0, y: 0 })
    }

    return () => (
      <NButtonGroup>
        <NPopover
          v-slots={{
            default: () => '缩小视图',
            trigger: () => (
              <NButton onClick={() => zoomOut()}>
                <LucideIcon name="ZoomOut" size={16}></LucideIcon>
              </NButton>
            )
          }}
        ></NPopover>
        <NPopover
          v-slots={{
            default: () => '重置缩放',
            trigger: () => (
              <NButton onClick={() => zoomReset('fit-viewport')}>
                <span style="text-align: center; display: inline-block; width: 40px">
                  {Math.floor(currentScale.value * 10) * 10 + '%'}
                </span>
              </NButton>
            )
          }}
        ></NPopover>
        <NPopover
          v-slots={{
            default: () => '放大视图',
            trigger: () => (
              <NButton onClick={() => zoomIn()}>
                <LucideIcon name="ZoomIn" size={16}></LucideIcon>
              </NButton>
            )
          }}
        ></NPopover>
      </NButtonGroup>
    )
  }
})

export default Scales

```

### 5.3 Command Stack

撤销恢复个人觉得是最简单的封装之一，毕竟 `CommandStack` 本身就记录了相关的图形操作以及属性更新。

```tsx
import { defineComponent } from 'vue'
import { NButton, NButtonGroup, NPopover } from 'naive-ui'
import EventEmitter from '@/utils/EventEmitter'
import type Modeler from 'bpmn-js/lib/Modeler'
import type CommandStack from 'diagram-js/lib/command/CommandStack'
import { createNewDiagram } from '@/utils'
import LucideIcon from '@/components/common/LucideIcon.vue'

const Commands = defineComponent({
  name: 'Commands',
  setup() {
    let command: CommandStack | null = null

    EventEmitter.on('modeler-init', (modeler: Modeler) => {
      command = modeler.get<CommandStack>('commandStack')
    })

    const undo = () => {
      command && command.canUndo() && command.undo()
    }

    const redo = () => {
      command && command.canRedo() && command.redo()
    }

    const restart = () => {
      command && command.clear()
      createNewDiagram()
    }

    return () => (
      <NButtonGroup>
        <NPopover
          v-slots={{
            default: () => '撤销',
            trigger: () => (
              <NButton onClick={undo}>
                <LucideIcon name="Undo2" size={16}></LucideIcon>
              </NButton>
            )
          }}
        ></NPopover>
        <NPopover
          v-slots={{
            default: () => '恢复',
            trigger: () => (
              <NButton onClick={redo}>
                <LucideIcon name="Redo2" size={16}></LucideIcon>
              </NButton>
            )
          }}
        ></NPopover>
        <NPopover
          v-slots={{
            default: () => '擦除重做',
            trigger: () => (
              <NButton onClick={restart}>
                <LucideIcon name="Eraser" size={16}></LucideIcon>
              </NButton>
            )
          }}
        ></NPopover>
      </NButtonGroup>
    )
  }
})

export default Commands
```

## 5. Module Configuration

在进行深度自定义之前，这里先介绍 `bpmn.js Modeler` 本身默认引用的 `Modules` 的一些配置项。

### 5.1 BpmnRenderer Configuration

控制画布区域的元素渲染

1. `defaultFillColor`：元素填充色，例如任务节点中间的空白部分的填充色，默认为 `undefined`
2. `defaultStrokeColor`：元素边框颜色，也可以理解为路径类元素的颜色，默认为 `undefined`，显示为黑色
3. `defaultLabelColor`：`Label` 标签字体颜色，默认为 `undefined`，显示为黑色

可以通过以下方式更改：

```typescript
const modeler = new Modeler({
    container: 'xx',
    bpmnRenderer: {
        defaultFillColor: '#eeeeee',
        defaultStrokeColor: '#2a2a2a',
        defaultLabelColor: '#333333'
    }
})
```

### 5.2 TextRenderer Configuration

控制画布区域的文字渲染

1. `fontFamily`: 文字字体，默认为 `'Arial, sans-serif'`
2. `fontSize`: 文字大小，默认 `12px`
3. `fontWeight`: 文字粗细，默认为 `'normal'`
4. `lineHeight`: 文本行高，默认为 1.2
5. `size`: 生成的文本标签的大小，默认为 `{ width: 150, height: 50 }`
6. `padding`: 文本标签内间距，默认为 0
7. `style`: 文本标签其他 css 样式
8. `align`: 内部文本对齐方式，默认为 `center-top`

可以通过传入配置项 `textRenderer: {}` 更改

### 5.3 ContextPad Configuration

控制元素的上下文菜单位置与大小缩放

1. `autoPlace`：是否调用 `AutoPlace` 模块来实现新元素创建时自动定位，默认为 `undefined`，如果配置该属性并设置为 `false` 的话，在利用 `contextPad` 创建新元素时需要手动选择新元素位置
2. `scale`：缩放的限制范围，默认为 `{ min: 1.0, max: 1.5 }`

可以通过传入配置项 `contextPad: {}` 更改

### 5.4 Canvas Configuration

控制画布区域大小与更新频率

1. `deferUpdate`: 是否配置延迟更新画布改变，默认为 `undefined`，如果配置该属性并设置为 `false` 的话，则会即时更新画布显示（会消耗大量资源）
2. `width`: 宽度，默认为 '100%'
3. `height`: 高度，默认为 '100%'

### 5.5 Keyboard Configuration

键盘事件的绑定对象

1. `bindTo`: 设置绑定对象，默认为 `undefined`，一般会配置为 `document` 或者 `window`

可以通过传入配置项 `keyboard: {}` 配置，默认快捷键列表如下：

![Keyboard Shortcuts.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cf44d66d6fc440c7a0e3211bdfb6f19e~tplv-k3u1fbpfcp-watermark.image?)

### 5.6 AutoScroll Configuration

鼠标焦点移动到画布边框位置时开启画布滚动，主要配置触发区域与滚动设置

1. `scrollThresholdIn`：触发滚动的边界距离最大值，默认为 `[ 20, 20, 20, 20 ]`
2. `scrollThresholdOut`：触发滚动的边界距离最小值，默认为 `[ 0, 0, 0, 0 ]`
3. `scrollRepeatTimeout`：滚动间隔，默认为 15 ms
4. `scrollStep`：滚动步长。默认为 6

可以通过传入配置项 `autoScroll: {}` 配置

### 5.7 ZoomScroll Configuration

鼠标滚轮缩放的配置

1. `enabled`: 是否启动鼠标滚轮缩放功能，默认为 `undefined`，如果配置该属性并设置为 `false` 的话，则会禁用鼠标滚动缩放功能
2. `scale`: 缩放倍率，默认为 0.75

可以通过传入配置项 `zoomScroll: {}` 配置

> 当然，这部分只是 `bpmn.js` 与 `diagram.js` 内部的插件模块提供的配置项，在我们的自定义模块也可以通过依赖 `config` 来配置更多的可用配置项，使 `Modeler` 更加灵活

# 下面，进行 `Modeler` 的核心插件自定义的讲解

## 6. Custom Element And Properties

在第四节 `Properties Panel` 中，大概讲解了自定义元素属性的方式。参照 [Bpmn-js自定义描述文件说明-掘金](https://juejin.cn/post/6912331982701592590) 和 [bpmn-io/moddle](https://github.com/bpmn-io/moddle/blob/master/docs/descriptor.md)，这里再重新说明一下。

一个 `moddleExtension` 描述文件的格式为 `json`，或者是一个可以导出 `json` 对象的 `js/ts` 文件，该描述文件(对象)包含以下几个属性：

1. `name`: 该部分扩展的名称，一般根据流程引擎来命名，字符串格式
2. `uri`: 统一资源标识符，一般是一个地址字符串
3. `prefix`: 属性或者元素统一前缀，小写字符串格式
4. `xml`: 格式转换时的配置，一般用来配置 `{ "tagAlias": "lowerCase" }`, 表示会将标签名转换为小写驼峰，可省略
5. `types`: 核心部分，用来声明元素和属性，以及扩展原有属性等，对象数组格式
6. `enumerations`: 枚举值定义部分，可以用来定义 `types` 中某个配置属性的可选值
7. `associations`: 组合定义，暂时作为保留配置

`types` 作为核心部分，通过一个特定格式的对象数组来描述元素与属性之间的关系，以及每个属性的类型和位置。

```typescript
type Type = {
    name: string
    extends?: string[]
    superClass?: string[]
    isAbstract?: boolean
    meta?: TypeMeta
    properties: TypeProperty[]
}

type TypeMeta = {
    allowedIn?: string[] | ['*']
}

type TypeProperty = {
    name: string
    type: string // 支持 boolean, string, number 这几个简单类型，此时可以设置 default 默认值；也支持自定义元素作为属性值
    isAttr?: boolean // 是否作为一个 xml 标签属性，为 true 时会将该属性值转换为 boolean, string, number 简单类型，对象等类型会转为 '[object Object]'
    isBody?: boolean // 是否将值插入到 xml 标签内部作为 content，转换方式与 isAttr 一致，但是这两个属性不能共存
    isMany?: boolean // 是否支持多个属性，一般这种情况下 type 是一个继承自 Element 的自定义元素，会将子元素插入到 xml 标签的 content 区域中，默认为 false 
    isReference?: boolean // 是否将 type 指定的自定义元素的 id 作为值，体现在 xml 上时该属性为对应的元素 id 字符串，但是通过 modeler 解析后该属性指向对应的元素实例
    redefines?: string // 重定义继承元素的某个属性配置，通常与 superClass 配合使用，例如 "redefines": "bpmn:StartEvent#id"
    default?: string | number | boolean
}
```

```javascript
example = {
    // ...
    // 表示创建属性或者元素时，需要增加的前缀，比如创建 ExampleElement 需要 moddle.create('ex:ExampleElement', {})
    prefix: 'ex',
    types: [
        {
            name: 'ExampleElement',
            /**
             * 继承 Element 的默认属性，表示可以创建一个 xml 元素标签更新到 xml 数据中
             * 该继承关系类似 js 原型链，如果继承的元素最终都继承自 Element，那么该属性也可以生成 xml 元素标签
             */
            superClass: ['Element'],
            /**
             * 与 superClass 相反，extends 表示扩展原始元素的配置，并不代表继承。
             * 使用 extends 之后，该类型定义的 properties 最终都会体现到原始元素上，展示方式为 ex:propertyName='xxx' 
             * (这只代表配置的 propertyName 是一个简单属性，如果是自定义属性的话，需要根据属性类型来区分)
             */
            extends: ['bpmn:StartEvent'],
            /**
             * 设置 allowedIn 来定义该属性可以插入到哪些元素内部，可以设置 ['*'] 表示任意元素
             */
            meta: {
                allowedIn: ['bpmn:StartEvent']
            },
            properties: [
                {
                    name: 'exProp1',
                    type: 'String', 
                    default: '2'
                }
            ]
        }
    ]
}
```

> 注意：superClass 与 extends 不能同时使用，两者的区别也可以查看官方回复 [issue-21](https://github.com/bpmn-io/moddle/issues/21)
> 
> 完整演示见 [properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/master/properties-panel-extension), [bpmn-js-example-custom-elements](https://github.com/bpmn-io/bpmn-js-example-custom-elements)

## 7. Custom Renderer, Palette and ContextPad

关于如何扩展原始 `Renderer`, `Palette` (这里其实应该是 `PaletteProvider`) 和 `ContextPad` (这里其实应该是 `ContextPadProvider`)，霖呆呆和 `bpmn` 官方都给出了示例。

1. [官方示例/bpmn-js-example-custom-elements](https://github.com/bpmn-io/bpmn-js-example-custom-elements)
2. 霖呆呆的文档地址 [全网最详bpmn.js教材目录](https://juejin.cn/post/6844904017567416328) 和示例仓库 [bpmn-vue-custom](https://github.com/LinDaiDai/bpmn-vue-custom)

这里针对核心部分简单讲解一下。

### 7.1 `Renderer`

重新自定义元素的渲染逻辑，可以区分为 “部分自定义” 与 “完全自定义”，“部分自定义” 又可以分为 “自定义新增元素类型渲染” 和 “自定义原始类型渲染”，核心逻辑其实就是改变 `Renderer` 构造函数上的 `drawShape` 方法。

```typescript
declare class BpmnRenderer extends BaseRenderer {
    constructor(config: Object, eventBus: EventBus, styles: Styles, pathMap: PathMap, canvas: Canvas, textRenderer: TextRenderer, priority?: number)

    handlers: Record<string, RendererHandler>
    _drawPath(parentGfx: SVGElement, element: Base, attrs?: Object): SVGElement
    _renderer(type: RendererType): RendererHandler
    getConnectionPath<E extends Base>(connection: E): string
    getShapePath<E extends Base>(element: E): string
    canRender<E extends Base>(element: E): boolean
    drawShape<E extends Base>(parentGfx: SVGElement, element: E): SVGRectElement
}
```

原生 `BpmnRenderer` 继承自抽象函数 `BaseRenderer`，通过 `drawShape` 方法来绘制 svg 元素，之后添加到 `canvas` 画布上。但是 `drawShape` 的核心逻辑其实就是根据 `element` 元素类型来调用 `handler[element.type]()` 实现元素绘制的。

```javascript
BpmnRenderer.prototype.drawShape = function(parentGfx, element) {
  var type = element.type;
  var h = this._renderer(type);
  return h(parentGfx, element);
};
```

在 “自定义新增元素类型渲染” 或者 “对原始 svg 元素增加细节调整” 的时候，可以通过继承 `BaseRenderer` 之后实现 `drawShape` 方法来实现。

```typescript
class CustomRenderer extends BaseRenderer {
    constructor(eventBus: EventBus, bpmnRenderer: BpmnRenderer) {
        super(eventBus, 2000);
        this.bpmnRenderer = bpmnRenderer;
    }
    drawShape(parentNode: SVGElement, element: Base) {
        // 处理自定义元素
        if (is(element, 'ex:ExampleElement')) {
            const customElementsSVGPath = '这里是自定义元素的 svg path 路径'
            const path = svgCreate('path')
            svgAttr(path, { d: customElementsSVGPath })
            svgAttr(path, attrs)
            svgAppend(parentGfx, path)
            // 需要 return 该 svg 元素
            return path
        }
        // 调用 bpmnRenderer.drawShape 来实现原始元素的绘制
        const shape = this.bpmnRenderer.drawShape(parentNode, element);
        // 对原有元素 UserTask 增加细节调整
        if (is(element, 'bpmn:UserTask')) {
            svgAttr(shape, { fill: '#eee' });
        }
        return shape
    }
}
CustomRenderer.$inject = [ 'eventBus', 'bpmnRenderer' ];

// 使用时，需要注意大小写
export default {
    __init__: ['customRenderer'],
    customRenderer: ['type', CustomRenderer]
}
```

当然，上面这种方式基本上很难满足大部分的自定义渲染需求，毕竟有时候需要的不是给原始元素增加细节，而是需要将整个元素全部重新实现（UI同事的审美通常都比我们要“强”不少），虽然可以在调用 `this.bpmnRenderer.drawShape()` 来绘制剩余类型之前，我们还可以增加很多个元素的处理逻辑，但这样无疑会使得这个方法变得异常臃肿，而且很难通过配置来实现不同的元素样式。

**所以，我们可以在 `BpmnRenderer` 的源码基础上，重新实现一个 `RewriteRenderer`。**不过这部分代码有点长（2000+行），这里暂时就不放出来了🤪

### 7.2 `Palette` 与 `ContextPad` 

针对这两个模块，自定义的逻辑其实与 `Renderer` 类似，只不过是对应的方法不一样。

`CustomPaletteProvider` 需要依赖 `Palette` 实例，并实现 `getPaletteEntries` 方法来将自定义部分的内容插入到 `palette` 中。

```typescript
class CustomPaletteProvider {
    // ... 需要定义 _palette 等属性
    constructor(palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect) {
        this._palette = palette
        this._create = create
        this._elementFactory = elementFactory
        this._spaceTool = spaceTool
        this._lassoTool = lassoTool
        this._handTool = handTool
        this._globalConnect = globalConnect
        
        // 注册该 Provider
        palette.registerProvider(this);
    }
    getPaletteEntries() {
        return {
            'custom-palette-item': {
                group: 'custom', // 分组标志，group 值相同的选项会出现在同一个区域
                className: 'custom-palette-icon-1',
                title: '自定义选项1',
                action: {
                    click: function (event) {
                        alert(1)
                    },
                    dragstart: function (event) {
                        alert(2)
                    }
                }
            },
            'tool-separator': {
                group: 'tools',
                separator: true // 指定该配置是显示一个分割线
            },
        }
    }
}

export default {
    __init__: ['customPaletteProvider'],
    // 如果要覆盖原有的 paletteProvider, 可以写为 paletteProvider: ['type', CustomPaletteProvider]，__init__ 属性此时可以省略
    customPaletteProvider: ['type', CustomPaletteProvider]
}
```

`CustomContextPadProvider` 作为元素选中时会提示的上下文菜单，与 `CustomPaletteProvider` 的实现逻辑基本一致，但是需要注意 `AutoPlace` 模块的引用。

```typescript
class CustomContextPadProvider {
    constructor(
        config: Object,
        injector: Injector,
        eventBus: EventBus,
        contextPad: ContextPad,
        modeling: Modeling,
        elementFactory: ElementFactory,
        connect: Connect,
        create: Create,
        popupMenu: PopupMenu,
        canvas: Canvas,
        rules: Rules
    ) {
        if (config.autoPlace !== false) {
            this._autoPlace = injector.get('autoPlace', false);
        }
        contextPad.registerProvider(this);
    }

    getContextPadEntries(element: Base) {
        const actions: Record<string, any> = {}

        const appendUserTask = (event: Event, element: Shape) => {
            const shape = this._elementFactory.createShape({ type: 'bpmn:UserTask' })
            this._create.start(event, shape, {
                source: element
            })
        }

        const append = this._autoPlace
            ? (event: Event, element: Shape) => {
                const shape = this._elementFactory.createShape({ type: 'bpmn:UserTask' })
                this._autoPlace.append(element, shape)
            }
            : appendUserTask

        // 添加创建用户任务按钮
        actions['append.append-user-task'] = {
            group: 'model',
            className: 'bpmn-icon-user-task',
            title: '用户任务',
            action: {
                dragstart: appendUserTask,
                click: append
            }
        }

        // 添加一个与edit一组的按钮
        actions['enhancement-op-1'] = {
            group: 'edit',
            className: 'enhancement-op',
            title: '扩展操作1',
            action: {
                click: function (e: Event) {
                    alert('点击 扩展操作1')
                }
            }
        }

        // 添加一个新分组的自定义按钮
        actions['enhancement-op'] = {
            group: 'enhancement',
            className: 'enhancement-op',
            title: '扩展操作2',
            action: {
                click: function (e: Event) {
                    alert('点击 扩展操作2')
                }
            }
        }

        return actions
    }
}

export default {
    __init__: ['customContextPadProvider'],
    // 如果要覆盖原有的 ContextPadProvider, 可以写为 contextPadProvider: ['type', CustomContextPadProvider]，__init__ 属性此时可以省略
    customContextPadProvider: ['type', CustomContextPadProvider]
}
```

## 8. Replace Options (PopupMenu)

这部分功能默认是通过 `ContextPad` 中间的小扳手 🔧 来触发的，主要是用来更改当前元素的类型。很多小伙伴反馈说其实里面的很多选项都不需要，这里对如何实现该部分更改进行说明。

1. 通过 `css` 隐藏 `dev.djs-popup-body` 节点下的多余节点，因为不同的元素类型有不同的 `css class` 类名，可以通过类名设置 `display: none` 隐藏
2. 直接修改 `ReplaceOptions` 的数据

```javascript
import { TASK } from 'bpmn-js/lib/features/replace/ReplaceOptions';

// 移除多余的选项
GATEWAY.splice(2, GATEWAY.length);

// 注意需要在 new Modeler 之前，并且这种方式不支持 cdn 引入
```
3. 修改 `ReplaceMenuProvider`, 这里与自定义 `ContextPadProvider` 的逻辑类似。

```typescript
// 源码位置见 bpmn-js/lib/features/popup-menu/ReplaceMenuProvider.js

import * as replaceOptions from '../replace/ReplaceOptions';

class CustomReplaceMenuProvider extends ReplaceMenuProvider {
    constructor(bpmnFactory, popupMenu, modeling, moddle, bpmnReplace, rules, replaceMenuProvider, translate) {
        super(bpmnFactory, popupMenu, modeling, moddle, bpmnReplace, rules, translate);
        this.register();
    }

    getEntries(element) {
        if (!rules.allowed('shape.replace', { element: element })) {
            return [];
        }
        const differentType = isDifferentType(element);
        if (is(elemeny, 'bpmn:Gateway')) {
            entries = filter(replaceOptions.GATEWAY.splice(2, replaceOptions.GATEWAY.length), differentType);
            return this._createEntries(element, entries);
        }
        return replaceMenuProvider.getEntries(element)
    }
}
ReplaceMenuProvider.$inject = [
    'bpmnFactory',
    'popupMenu',
    'modeling',
    'moddle',
    'bpmnReplace',
    'rules',
    'replaceMenuProvider',
    'translate'
];
```

## 9. 自己实现 Properties Panel

虽然根据 第 4.4 小节可以知道，我们可以通过自定义一个属性面板分组，来插入到原生的 `Bpmn Properties Panel` 中，但是这样实现，第一是基本不符合国内的审美，第二就是写法太复杂，第三则是对控制参数传递的实现十分困难。既然现在的 `MVVM` 框架都支持 `props` 数据传递来控制参数改变，并且有很多精美的开源组件库，那可不可以自己实现一个属性面板呢？

答案是当然可以的。

`bpmn.js` 的属性更新操作都是通过 `modeling.updateProperties` 与 `modeling.updateModdlePropertis` 这两个 api 来实现的，实现一个属性面板的核心逻辑就在于监听当前选中元素的变化，来控制对应的属性面板的渲染；并且对属性面板的输出结果通过以上两个 api 更新到元素实例上，从而实现完整的属性更新流程。

> 后续以 `Flowable` 流程引擎为例进行讲解。

### 9.1 第一步：设置监听事件寻找选中元素

如何设置当前的选中元素来控制属性面板的渲染，根据第 4.2 小节，可以结合 `BpmnPropertiesPanel` 组件的写法，通过监听 `selection.changed`, `elements.changed`, `root.added`(或者 `import.done`) 几个事件来设置当前元素。这里大致解释一下为什么是这几个事件：

1. `root.added`(或者 `import.done`)：在根元素(`Process`节点)创建完成(或者流程导入结束)时，默认是没有办法通过 `selection` 模块拿到选中元素，所以我们可以默认设置根元素为选中元素来渲染属性面板
2. `selection.changed`：这个事件在鼠标点击选中事件改变时会触发，默认返回一个选中元素数组（可能为空），这里我们取数组第一个元素(为空时设置成根元素)来渲染属性面板
3. `elements.changed`：这个事件则是为了控制属性面板的数据回显，因为数据有可能是通过其他方式更新了属性

我们先创建一个 `PropertiesPanel` 组件：

```tsx
import { defineComponent, ref } from 'vue'
import debounce from 'lodash.debounce'
import EventEmitter from '@/utils/EventEmitter'
import modelerStore from '@/store/modeler'

const PropertiesPanel = defineComponent({
    setup() {
        // 这里通过 pinia 来共享当前的 modeler 实例和选中元素
        const modeler = modelerStore()
        const penal = ref<HTMLDivElement | null>(null)
        const currentElementId = ref<string | undefined>(undefined)
        const currentElementType = ref<string | undefined>(undefined)

        // 在 modeler 实例化结束之后在创建监听函数 (也可以监听 modeler().getModeler 的值来创建)
        EventEmitter.on('modeler-init', (modeler) => {
            // 导入完成后默认选中 process 节点
            modeler.on('import.done', () => setCurrentElement(null))
            // 监听选择事件，修改当前激活的元素以及表单
            modeler.on('selection.changed', ({ newSelection }) => setCurrentElement(newSelection[0] || null))
            // 监听元素改变事件
            modeler.on('element.changed', ({ element }) => {
                // 保证 修改 "默认流转路径" 等类似需要修改多个元素的事件发生的时候，更新表单的元素与原选中元素不一致。
                if (element && element.id === currentElementId.value) setCurrentElement(element)
            })
        })

        // 设置选中元素，更新 store；这里做了防抖处理，避免重复触发（可以取消）
        const setCurrentElement = debounce((element: Shape | Base | Connection | Label | null) => {
            let activatedElement: BpmnElement | null | undefined = element
            if (!activatedElement) {
                activatedElement =
                    modeler.getElRegistry?.find((el) => el.type === 'bpmn:Process') ||
                    modeler.getElRegistry?.find((el) => el.type === 'bpmn:Collaboration')

                if (!activatedElement) {
                    return Logger.prettyError('No Element found!')
                }
            }

            modeler.setElement(markRaw(activatedElement), activatedElement.id)
            currentElementId.value = activatedElement.id
            currentElementType.value = activatedElement.type.split(':')[1]
        }, 100)
        
        return () => (<div ref={penal} class="penal"></div>)
    }
})

```

### 9.2 第二步：判断元素类型和数据来控制属性面板

在获取到选中元素之后，我们需要根据元素类型来控制显示不同的属性面板组件（这里建议参考官方的属性面板的写法，将判断方法和属性值的更新读取拆分成不同的 `hooks` 函数）。

比如几个异步属性(`asyncBefore`, `asyncAfter`, `exclusive`)，这几个属性只有在选中元素的 `superClass` 继承链路中有继承 `flowable:AsyncCapable` 才会体现。所以我们编写一个判断函数：

```typescript
import { is } from 'bpmn-js/lib/util/ModelUtil'
export function isAsynchronous(element: Base): boolean {
  return is(element, 'flowable:AsyncCapable')
}
```

在 `PropertiesPanel` 组件中，就可以通过调用该函数判断是否显示对应部分的属性面板

```tsx
import { defineComponent, ref } from 'vue'
const PropertiesPanel = defineComponent({
    setup() {
        // ...
        return () => (
            <div ref={penal} class="penal">
                <NCollapse arrow-placement="right">
                    <ElementGenerations></ElementGenerations>
                    <ElementDocumentations></ElementDocumentations>
                    {isAsynchronous(modeler.getActive!) && (
                        <ElementAsyncContinuations></ElementAsyncContinuations>
                    )}
                </NCollapse>
            </div>
        )
    }
})
export default PropertiesPanel
```

### 9.3 第三步：实现对应的属性面板更新组件

上一步，我们通过判断元素时候满足异步属性来显示了 `ElementAsyncContinuations` 组件，但是 `ElementAsyncContinuations` 组件内部如何实现元素的读取和更新呢？

> 具体包含哪些属性，可以查看 `flowable.json`

首先，我们先实现 `ElementAsyncContinuations` 组件，包含 `template` 模板和基础的更新方法。

```vue
<template>
  <n-collapse-item name="element-async-continuations">
    <template #header>
      <collapse-title title="异步属性">
        <lucide-icon name="Shuffle" />
      </collapse-title>
    </template>
    <edit-item label="Before" :label-width="120">
      <n-switch v-model:value="acBefore" @update:value="updateElementACBefore" />
    </edit-item>
    <edit-item label="After" :label-width="120">
      <n-switch v-model:value="acAfter" @update:value="updateElementACAfter" />
    </edit-item>
    <edit-item v-if="showExclusive" label="Exclusive" :label-width="120">
      <n-switch v-model:value="acExclusive" @update:value="updateElementACExclusive" />
    </edit-item>
  </n-collapse-item>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import { mapState } from 'pinia'
  import modelerStore from '@/store/modeler'
  import {
    getACAfter,
    getACBefore,
    getACExclusive,
    setACAfter,
    setACBefore,
    setACExclusive
  } from '@/bo-utils/asynchronousContinuationsUtil'

  export default defineComponent({
    name: 'ElementAsyncContinuations',
    data() {
      return {
        acBefore: false,
        acAfter: false,
        acExclusive: false
      }
    },
    computed: {
      ...mapState(modelerStore, ['getActive', 'getActiveId']),
      showExclusive() {
        return this.acBefore || this.acAfter
      }
    },
    watch: {
      getActiveId: {
        immediate: true,
        handler() {
          this.reloadACStatus()
        }
      }
    },
    methods: {
      reloadACStatus() {
        this.acBefore = getACBefore(this!.getActive)
        this.acAfter = getACAfter(this!.getActive)
        this.acExclusive = getACExclusive(this!.getActive)
      },
      updateElementACBefore(value: boolean) {
        setACBefore(this!.getActive, value)
        this.reloadACStatus()
      },
      updateElementACAfter(value: boolean) {
        setACAfter(this!.getActive, value)
        this.reloadACStatus()
      },
      updateElementACExclusive(value: boolean) {
        setACExclusive(this!.getActive, value)
        this.reloadACStatus()
      }
    }
  })
</script>
```

这里基本实现了根据元素 id 的变化，来更新元素的异步属性配置，并且在属性面板的表单项发生改变时更新该元素的属性。

这里对几个属性的获取和更新方法提取了出来。

```typescript
import { Base, ModdleElement } from 'diagram-js/lib/model'
import editor from '@/store/editor'
import modeler from '@/store/modeler'
import { is } from 'bpmn-js/lib/util/ModelUtil'

////////// only in element extends bpmn:Task
export function getACBefore(element: Base): boolean {
  return isAsyncBefore(element.businessObject, 'flowable')
}
export function setACBefore(element: Base, value: boolean) {
  const modeling = modeler().getModeling
  // overwrite the legacy `async` property, we will use the more explicit `asyncBefore`
  modeling.updateModdleProperties(element, element.businessObject, {
    [`flowable:asyncBefore`]: value,
    [`flowable:async`]: undefined
  })
}

export function getACAfter(element: Base): boolean {
  return isAsyncAfter(element.businessObject, 'flowable')
}
export function setACAfter(element: Base, value: boolean) {
  const prefix = editor().getProcessEngine
  const modeling = modeler().getModeling
  modeling.updateModdleProperties(element, element.businessObject, {
    [`flowable:asyncAfter`]: value
  })
}

export function getACExclusive(element: Base): boolean {
  return isExclusive(element.businessObject, 'flowable')
}
export function setACExclusive(element: Base, value: boolean) {
  const prefix = editor().getProcessEngine
  const modeling = modeler().getModeling
  modeling.updateModdleProperties(element, element.businessObject, {
    [`flowable:exclusive`]: value
  })
}

//////////////////// helper
// 是否支持异步属性
export function isAsynchronous(element: Base): boolean {
  const prefix = editor().getProcessEngine
  return is(element, `flowable:AsyncCapable`)
}

// Returns true if the attribute 'asyncBefore' is set to true.
function isAsyncBefore(bo: ModdleElement, prefix: string): boolean {
  return !!(bo.get(`flowable:asyncBefore`) || bo.get('flowable:async'))
}

// Returns true if the attribute 'asyncAfter' is set to true.
function isAsyncAfter(bo: ModdleElement, prefix: string): boolean {
  return !!bo.get(`flowable:asyncAfter`)
}

// Returns true if the attribute 'exclusive' is set to true.
function isExclusive(bo: ModdleElement, prefix: string): boolean {
  return !!bo.get(`flowable:exclusive`)
}
```

这样，我们就得到了一个基础的属性面板。

> 当前模式只能在 id 更新时才更新数据，不是十分完美。建议在 `element.changed` 事件发生时通过 `EventEmitter` 来触发业务组件内部的数据更新。

### 9.4 复杂属性的更新

上一节提到的属性都是作为很简单的属性，可以直接通过 `updateModdleProperties(element, moddleElement, { key: value})` 的形式来更新，不需要其他步骤。

但是如果这个属性不是一个简单属性，需要如何创建？这里我们以在 `Process` 节点下创建 `ExecutionListener` 为例。

首先，我们在 `flowable.json` 中查看 `ExecutionListener` 的属性配置。

```json
{
  "name": "ExecutionListener",
  "superClass": ["Element"],
  "meta": {
    "allowedIn": [
      // ...
      "bpmn:Process"
    ]
  },
  "properties": [
    {
      "name": "expression",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "class",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "delegateExpression",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "event",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "script",
      "type": "Script"
    },
    {
      "name": "fields",
      "type": "Field",
      "isMany": true
    }
  ]
}
```

可以看到这个属性继承了 `Element` 属性，所以肯定可以创建一个 xml 标签；`meta` 配置里面表示它允许被插入到 `Process` 节点中。

但是 `Process` 节点的定义下并没有支持 `ExecutionListener` 属性的相关配置，所以我们接着查看 `bpmn.json`，发现也没有相关的定义。这时候怎么办呢？

我们仔细研究一下两个文件里面关于 `Process` 元素的配置：

```
// flowable.json
{
  "name": "Process",
  "isAbstract": true,
  "extends": ["bpmn:Process"],
  "properties": [
    {
      "name": "candidateStarterGroups",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "candidateStarterUsers",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "versionTag",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "historyTimeToLive",
      "isAttr": true,
      "type": "String"
    },
    {
      "name": "isStartableInTasklist",
      "isAttr": true,
      "type": "Boolean",
      "default": true
    }
  ]
}
// bpmn.json
{
  "name": "Process",
  "superClass": ["FlowElementsContainer", "CallableElement"],
  "properties": [
    // ...
  ]
}

// 向上查找 FlowElementsContainer
{
  "name": "FlowElementsContainer",
  "isAbstract": true,
  "superClass": ["BaseElement"],
  "properties": [
    //. ..
  ]
}

// 向上查找 BaseElement
{
  "name": "BaseElement",
  "isAbstract": true,
  "properties": [
    {
      "name": "id",
      "isAttr": true,
      "type": "String",
      "isId": true
    },
    {
      "name": "documentation",
      "type": "Documentation",
      "isMany": true
    },
    {
      "name": "extensionDefinitions",
      "type": "ExtensionDefinition",
      "isMany": true,
      "isReference": true
    },
    {
      "name": "extensionElements",
      "type": "ExtensionElements"
    }
  ]
}

// 接着查找 ExtensionDefinition 和 ExtensionElements
{
  "name": "ExtensionElements",
  "properties": [
    {
      "name": "valueRef",
      "isAttr": true,
      "isReference": true,
      "type": "Element"
    },
    {
      "name": "values",
      "type": "Element",
      "isMany": true
    },
    {
      "name": "extensionAttributeDefinition",
      "type": "ExtensionAttributeDefinition",
      "isAttr": true,
      "isReference": true
    }
  ]
}
```

这里可以找到 `Process` 节点继承的 `BaseElement`, 有定义 `ExtensionElements`，并且 `ExtensionElements` 的 `values` 属性支持配置多个 `Element`。所以这里大概就是我们需要关注的地方了。
