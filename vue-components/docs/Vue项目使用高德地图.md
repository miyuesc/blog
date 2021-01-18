# 在Vue项目中如何使用高德地图

在一些简单的大屏类展示应用/网页中，经常会用到地图相关的展示场景，除了一些特殊的三维场景需要用 `Gis/BIM` 或者 `WebGL`，一些简单的业务就可以直接使用高德地图或者百度地图来完成。

本文主要讲述在 `Vue` 项目中高德地图 `JavaScript API` 的引用方式以及一些简单的 `API` 的使用。

> 演示项目使用 `vue cli 4.0` 脚手架搭建项目。

## 1. 引用

在高德地图发布 2.0 版本之前，通常只能以两种通用的方式加载，一种是直接在 `public/index.html` 的头部直接添加 `script` 标签，另一种则是在需要的时候异步加载，并传入回调函数。

### 1.1 `index.html` 直接添加

```html
// 这种方式必须在head中引入
<script src="https://webapi.amap.com/maps?v=1.4.13&key='你自己申请的key'"></script>
```

这种是会在页面加载前先下载高德地图的JavaScript文件，并在 `window` 对象下创建一个 `AMap` 对象。

### 1.2 `vue.config.js` 引入

```javascript
module.exports = {
    // ...
    chainWebpack: function(config) {
        config.plugin("html").tap(args => {
            const cdn ={
                css: [],
                js: [
                    "https://webapi.amap.com/maps?v=1.4.13&key='你自己申请的key'",
                    "//webapi.amap.com/ui/1.0/main.js"
                ]
            }
            // 判断环境
            if (process.env.NODE_ENV === "production") {
                args[0].cdn = cdn;
            }
            if (process.env.NODE_ENV === "development") {
                args[0].cdn = cdn;
            }
            return args;
        })
    },
    configureWebpack: function(config) {
        config.externals = {
        	AMap: "AMap"
        }
    }
}
```

这种方式与直接在 `public/index.html` 中引入类似，开发和发布生产环境的时候，都会在入口页面头部插入对应的地址。

### 1.3 异步引入

>  异步引用的方式可以减少首页渲染的时间，但是如果需要直接在主页面加载时就渲染地图的话，性能没有什么提升。

#### 编写异步加载方法

首先在 `src/utils/` 下创建一个加载文件 `remoteLoadAMap.js`。

```javascript
export function loadAMap(key, loadUI = true, version = "2.0") {
    return new Promise((resolve, reject) => {
        if (!key) {
            throw new Error("key不能为空");
        }
        if (window.AMap) {
            return resolve(window.AMap);
        }
        const src = `https://webapi.amap.com/maps?v=${version}&key=${key}&callback=onAMapLoad`;
        const script = document.createElement("script");
        script.onerror = () => {
          return reject();
        };
        script.src = src;
        document.head.appendChild(script);
        window.onAMapLoad = async () => {
            if (loadUI) {
                await loadAMapUI();
            }
            resolve(window.AMap);
        }
    })
}

export function loadAMapUI() {
	return new Promise((resolve, reject) => {
        if (window.AMapUI) {
            return resolve(window.AMapUI);
        }
        const script = document.createElement("script");
        script.src = "https://webapi.amap.com/ui/1.1/main.js";
        document.head.appendChild(script);
        script.onload = () => {
            return resolve(window.AMapUI);
        };
        script.onerror = () => {
            return reject();
        };
    });
}
```

### 1.4 官方 `loader` 加载

在高德地图发布 v 2.0 之后，也提供了一个 `JSAPI Loader` 用来异步加载 `AMap.js` 。

> 推荐使用

#### 1.4.1 安装

```shell
npm install @amap/amap-jsapi-loader --save
// or
yarn add @amap/amap-jsapi-loader --save
```

#### 1.4.2 使用

在 `AMap.vue` 文件的 `script` 部分直接引入并初始化。

```javascript
import AMapLoader from '@amap/amap-jsapi-loader';

export default {
    name: "AMap",
    beforeCreate() {
        AMapLoader.load({
            "key": "",              // 申请好的Web端开发者Key，首次调用 load 时必填
            "version": "1.4.15",    // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
            "plugins": [],          // 需要使用的的插件列表，如比例尺'AMap.Scale'等
            "AMapUI": {             // 是否加载 AMapUI，缺省不加载
            	"version": '1.1',   // AMapUI 缺省 1.1
            	"plugins":[]        // 需要加载的 AMapUI ui插件
            },
            "Loca": {               // 是否加载 Loca， 缺省不加载
            	"version": '1.3.2'  // Loca 版本，缺省 1.3.2
            }
        }).then( AMap => {
            this.$nextTick(() => this.initMap(AMap));
        }).catch(e => {
        	console.error(e);
        })
    },
    methods: {
        initMap(AMap) {
            this.map = new AMap.Map("container");
            // 或者使用 $refs 获取节点
            // this.map = new AMap.Map(this.$refs.container);
        }
    }
}

```



## 2. 使用

> 在初始化之前需要确保 `amap.js` 已经加载完成。建议先判断 `window` 下是否已经有 `AMap` 属性。



### 2.1 初始化地图实例

```javascript
// template
<div class="amap" ref="map-container"></div>

// script
window.AMap && (const map = new window.AMap.Map(this.$ref["map-container"]));

```









