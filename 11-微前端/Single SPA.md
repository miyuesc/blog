# Single SPA

## 1. 介绍

`Single SPA` 作为做早且最知名的微前端框架，目前已经更新到了第五个大版本，当前版本为 `v5.9.4`。

在 `Single SPA` 中定义了三种微前端实现方式，也可以称为“微前端类型”

1. `Applications` 应用程序：需要有对应的“路由匹配规则”，并且包含完整的 `SIngle SPA API` 和渲染部分，由 `Single SPA` 来管理应用生命周期。如果是按照路由来拆分应用的话，这种模式是最合适的一种
2. `Parcels` 沙箱：与路由完全无关，类似一个第三方库。并且与当前使用的技术栈也没有关联，可以由任意应用来挂载或者卸载。每个沙箱模块需要自己实现生命周期函数对应的处理过程，必须包含 `bootstrap` 初始化、`mount` 挂载、`unmount` 卸载方法。
3. `Common Modules` 通用模块：这个就和名字一样，给微应用共同使用的公共模块，不依赖路由，没有声明周期和渲染方式，仅作为一个公共依赖库使用，通常用来保存工具函数等内容

> 通常拆分一个“巨石应用”的方式，就是使用 `Application` 将每个业务功能模块进行拆分，针对全局共享的 UI 组件（比如用户信息弹窗、全局消息通知组件）等作为 `Parcel` 沙箱，最后将 `Utils` 和 `Styles` 等公共依赖模块放置到 `Common Module` 中进行共享。

## 2. 微应用拆分和管理

虽然将“巨石应用”拆分之后对各个微应用的管理更加便捷，也可以降低开发者的心智负担。但是，如何将所有微应用整合到一起呢？

`Single SPA` 团队在这个问题上给出了三个建议：

1. 公用一个仓库和一套打包配置（`Monorepo`），对于每个微应用打包之后都在根目录下的 `index.html` 文件中插入一个 `script` 标签用来引入微应用。
2. 采用 `NPM dependencies` 管理的方式，这样每个微应用都可以有自己的代码仓库和打包配置，并且互不影响；整体打包统一由根应用来安装微应用依赖并打包成整体。
3. 动态加载微应用模块，这样可以让子应用单独部署，由根应用控制加载对应的微应用。这里提供了两种版本控制的方式：
   1. 修改 Web 服务器，添加对应的版本控制脚本，这样不需要修改其他应用配置
   2. 使用 `System.js` 这样的浏览器模块加载方式，通过控制对应版本的微应用 `Url` 来实现应用控制

三种方式的优缺点对比如下：

| 拆分方式                     | 优点                                                                                                      | 缺点                                                                                                      |
|--------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `Monorepo`               | 1. 拆分简单<br/> 2. 方便整体管理                                                                                  | 1. 项目一样会越来越大<br/> 2. 公用打包配置，灵活性不够，受技术栈影响<br/> 3. 微应用不能独立构建和部署 4. 公用 `package.json`，依赖限制较大，项目安装依赖和启动都不便利 |
| `NPM dependencies`       | 1. 每个应用可独立开发，各自的依赖版本与打包配置不受影响<br/>2. 仓库独立，心智负担小，各应用管理更加便捷<br/>3. 通过根应用的 `package.json` 管理微应用版本，版本管理更加清晰 | 1. 完整应用发布依然受微应用版本限制，不能分开发布和部署<br/>2. 项目初始拆分的难度稍大<br/>3. 通常是公司或者产品组内部项目，需要独立的 `NPM` 包管理服务或者 `Git` 配置     |
| `Dynamic Module Loading` | 1. 微应用**完全独立**，心智负担小<br/>2. 通过配置文件或者脚本进行版本管理，更加便捷                                                       | 1. 首次应用拆分最为困难                                                                                           |

## 3. `Single SPA` 生态

为了方便用户快速且简单的接入 `Single SPA`，该团队提供了 13 个用于创建微应用的 `Generic lifecycle hooks` 模板依赖，常用的包括：

1. `single-spa-react`
2. `single-spa-vue`
3. `single-spa-angularjs`
4. `single-spa-preact`
5. `single-spa-svelte`

> 在接入对应技术栈的微应用时，只需要使用相应的依赖包来创建一个包含基础生命周期 `bootstrap`、`mount`、`update`、`unmount` 的微应用实例，之后在微应用入口处导出需要的生命周期数组即可。
>
> 并且每个依赖都实现了对应技术栈的 `Parcel` 沙箱构建方法。

以 `Vue 2` 项目为例初始化一个微应用：

```javascript
import Vue from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import router from './router';

// 根据依赖实例化对应的组件实例和生命周期
const vueLifecycles = singleSpaVue({
   Vue,
   appOptions: {
      render: (h) => h(App),
      router,
   }
})

// 导出需要使用的生命周期变量
export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;

// 如果你需要在某一个生命周期（例如初始化 bootstrap）时执行其他事件，也可以导出一个数组
const something1 = () => {
   console.log('do something')
}
const something2 = () => {
   console.log('do something')
}
export const bootstrap = [something1, something2, vueLifecycles.bootstrap];
```

> 这些依赖返回的生命周期函数都是 `Promise`

## 4. `Single SPA Vue`

> 因为笔者常用的框架就是 Vue，所以这里的代码分析也用的是 Vue 对应的依赖库。

`single-spa-vue`: Generic lifecycle hooks for Vue.js applications，一个为 `Vue.js` 应用程序的通用生命周期钩子函数的创建程序。

这个库的核心代码就 200 行，大致内容如下：

```javascript
const defaultOpts = {
    // ...
}

export default function singleSpaVue(userOpts) {
    // 1. arguments validate 参数校验
   const opts = {
      ...defaultOpts,
      ...userOpts,
   };
   // 2. 设置 Vue 实例创建方法，会判断 Vue 版本
   opts.createApp = opts.createApp || (opts.Vue && opts.Vue.createApp);
   // 3. 利用闭包，保存已挂载的实例
   let mountedInstances = {};
   // 4. 最后返回包含生命周期函数的对象
   return {
      bootstrap: bootstrap.bind(null, opts, mountedInstances),
      mount: mount.bind(null, opts, mountedInstances),
      unmount: unmount.bind(null, opts, mountedInstances),
      update: update.bind(null, opts, mountedInstances),
   };
}
```

### 4.1 `bootstrap` 初始化

`bootstrap` 方法仅作为实例的初始化方法，主要用于处理当前微应用的挂载对象，最后返回一个 `Promise`。

如果用户配置了 `loadRootComponent`，则将该实例对应的跟组件设置为 `loadRootComponent` 方法的返回值（`Promise.resolve` 的值）

```javascript
function bootstrap(opts) {
  if (opts.loadRootComponent) {
    return opts.loadRootComponent().then((root) => (opts.rootComponent = root));
  } else {
    return Promise.resolve();
  }
}
```

### 4.2 `mount` 挂载

该周期主要将微应用实例挂载到根应用（或者目标DOM）上，但是也包含了微应用实例的实例化过程。

```javascript
function resolveAppOptions(opts, props) {
   if (typeof opts.appOptions === "function") {
      return opts.appOptions(props);
   }
   return Promise.resolve({ ...opts.appOptions });
}

function mount(opts, mountedInstances, props) {
  // 0. 定义实例配置项
  const instance = {};
  return Promise.resolve().then(() => {
    // 1. 处理微应用参数
    return resolveAppOptions(opts, props).then((appOptions) => {
      // 2. 配置 目标挂载节点查找条件
      if (props.domElement && !appOptions.el) {
        appOptions.el = props.domElement;
      }

      // 3. 查找挂载节点（这里省略了校验报错部分）
      let domEl;
      if (appOptions.el) {
        if (typeof appOptions.el === "string") {
          domEl = document.querySelector(appOptions.el);
        } else {
          domEl = appOptions.el;
          appOptions.el = `#${CSS.escape(domEl.id)}`;
        }
      }
      // 4. 不存在配置的查找条件，则创建一个 dom 节点用于挂载
      else {
        const htmlId = `single-spa-application:${props.name}`;
        appOptions.el = `#${CSS.escape(htmlId)}`;
        domEl = document.getElementById(htmlId);
        if (!domEl) {
          domEl = document.createElement("div");
          domEl.id = htmlId;
          document.body.appendChild(domEl);
        }
      }

      // 5. 如果是要用实例替换挂载节点的话，会将Vue实例直接插入到该节点上
      if (!opts.replaceMode) {
        appOptions.el = appOptions.el + " .single-spa-container";
      }

      // 6. 希望始终将 Vue 实例挂载到该节点下的子节点中
      if (!domEl.querySelector(".single-spa-container")) {
        const singleSpaContainer = document.createElement("div");
        singleSpaContainer.className = "single-spa-container";
        domEl.appendChild(singleSpaContainer);
      }

      // 7. 设置实例的真正挂载 dom
      instance.domEl = domEl;

      // 8. 设置 Vue 实例化的 render 渲染函数和基础 data
      if (!appOptions.render && !appOptions.template && opts.rootComponent) {
        appOptions.render = (h) => h(opts.rootComponent);
      }
      if (!appOptions.data) {
        appOptions.data = {};
      }
      appOptions.data = () => ({ ...appOptions.data, ...props });

      // 9. 根据条件实例化 Vue 应用
      if (opts.createApp) {
        // vue 3
        instance.vueInstance = opts.createApp(appOptions);
        if (opts.handleInstance) {
          return Promise.resolve(
            opts.handleInstance(instance.vueInstance, props)
          ).then(function () {
            instance.root = instance.vueInstance.mount(appOptions.el);
            mountedInstances[props.name] = instance;
            return instance.vueInstance;
          });
        } else {
          instance.root = instance.vueInstance.mount(appOptions.el);
        }
      } else {
        // vue 2
        instance.vueInstance = new opts.Vue(appOptions);
        if (instance.vueInstance.bind) {
          instance.vueInstance = instance.vueInstance.bind(
            instance.vueInstance
          );
        }
        if (opts.handleInstance) {
          return Promise.resolve(
            opts.handleInstance(instance.vueInstance, props)
          ).then(function () {
            mountedInstances[props.name] = instance;
            return instance.vueInstance;
          });
        }
      }

      // 10. 在闭包对象中设置已实例化的微应用并返回应用实例
      mountedInstances[props.name] = instance;
      return instance.vueInstance;
    });
  });
}
```

### 4.3 `update` 更新与 `unmount` 卸载

更新与卸载其实和 `bootstrap` 初始化类似，逻辑比较简单。

```javascript
// 数据更新
function update(opts, mountedInstances, props) {
  return Promise.resolve().then(() => {
    const instance = mountedInstances[props.name];
    // 合并原始参数和新传入参数
    const data = {
      ...(opts.appOptions.data || {}),
      ...props,
    };
    const root = instance.root || instance.vueInstance;
    // 更新实例数据
    for (let prop in data) {
      root[prop] = data[prop];
    }
  });
}

// 实例卸载
function unmount(opts, mountedInstances, props) {
  return Promise.resolve().then(() => {
    // 1. 获取到当前微应用实例
    const instance = mountedInstances[props.name];
    // 2. 判断 Vue 版本来销毁实例
    if (opts.createApp) {
      instance.vueInstance.unmount(instance.domEl);
    } else {
      instance.vueInstance.$destroy();
      instance.vueInstance.$el.innerHTML = "";
    }
    // 3. 从闭包实例对象中删除该应用实例的引用
    delete instance.vueInstance;
    // 4. 清空实例 DOM 节点并移除
    if (instance.domEl) {
      instance.domEl.innerHTML = "";
      delete instance.domEl;
    }
  });
}
```

## 5. 总结

在拆分以前的“巨石应用”的最佳方式，就是采用 `Dynamic Module Loading` 动态模块加载的方式，不仅减少了单一仓库代码量和处理逻辑，更使得微应用之间的耦合关系达到了最低，各应用之间的独立部署和版本迭代也更加人性化。

为了方便用户使用，`Single SPA` 的团队也在努力完善他们的生态，在他们提供的生命周期处理依赖的帮助下，用户可以很轻松的接入一个新的微应用。