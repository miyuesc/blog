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

> 不论哪种方式，最终都会在 `window` 对象下添加一个对象属性 `AMap`

## 2. 使用

> 在初始化之前需要确保 `amap.js` 已经加载完成。建议先判断 `window` 下是否已经有 `AMap` 属性。



### 2.1 初始化地图实例

```html
// template
<div class="amap" ref="map-container"></div>

// script
<script>
window.AMap && (const map = new window.AMap.Map(this.$ref["map-container"]));
</script>

```

### 2.2 异步加载地图插件

除了在初始化地图的时候直接预加载插件之外，也可以在需要调用插件的地方异步加载插件。

#### a. 同步预加载插件

可以在引用高德地图api的时候直接在地址后用参数的形式传入需要用到的插件名称。

```html
// 1. public.html
<script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=您申请的key值&plugin=AMap.ToolBar,AMap.Driving"></script>

// 2. AMapLoader
<script>
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
            	"plugins":["AMap.ToolBar", "AMap.Driving"]        // 需要加载的 AMapUI ui插件
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
</script>
```

#### b. 异步加载插件

高德地图的 `AMap` 的原型上提供了异步加载插件的方法 `AMap.plugin()`。

`AMap.plugin` 接收两个参数，第一个参数为需要加载的插件名称或者插件名称组成数组，第二个参数为加载完成后执行的回调函数。

```javascript
var map = new AMap.Map('container',{
    zoom:12,
    center:[116.39,39.9]
});

// 单个插件
AMap.plugin('AMap.ToolBar',function(){//异步加载插件
    var toolbar = new AMap.ToolBar();
    map.addControl(toolbar);
});

// 多个插件
AMap.plugin(['AMap.ToolBar','AMap.Driving'],function(){//异步同时加载多个插件
    var toolbar = new AMap.ToolBar();
    map.addControl(toolbar);
    var driving = new AMap.Driving();//驾车路线规划
    driving.search(/*参数*/)
});
```

#### c. 可用插件列表

| 类名                      | 类功能说明                                                   |
| :------------------------ | :----------------------------------------------------------- |
| `AMap.ElasticMarker`      | 灵活点标记，可以随着地图级别改变样式和大小的 Marker          |
| `AMap.ToolBar`            | 工具条，控制地图的缩放、平移等                               |
| `AMap.Scale`              | 比例尺，显示当前地图中心的比例尺                             |
| `AMap.HawkEye`            | 鹰眼，显示缩略图                                             |
| `AMap.MapType`            | 图层切换，用于几个常用图层切换显示                           |
| `AMap.Geolocation`        | 定位，提供了获取用户当前准确位置、所在城市的方法             |
| `AMap.AdvancedInfoWindow` | 高级信息窗体，整合了周边搜索、路线规划功能                   |
| `AMap.AutoComplete`       | 输入提示，提供了根据关键字获得提示信息的功能                 |
| `AMap.PlaceSearch`        | 地点搜索服务，提供了关键字搜索、周边搜索、范围内搜索等功能   |
| `AMap.DistrictSearch`     | 行政区查询服务，提供了根据名称关键字、`citycode`、`adcode` 来查询行政区信息的功能 |
| `AMap.LineSearch`         | 公交路线服务，提供公交路线相关信息查询服务                   |
| `AMap.StationSearch`      | 公交站点查询服务，提供途经公交线路、站点位置等信息           |
| `AMap.Driving`            | 驾车路线规划服务，提供按照起、终点进行驾车路线的功能         |
| `AMap.TruckDriving`       | 货车路线规划                                                 |
| `AMap.Transfer`           | 公交路线规划服务，提供按照起、终点进行公交路线的功能         |
| `AMap.Walking`            | 步行路线规划服务，提供按照起、终点进行步行路线的功能         |
| `AMap.Riding`             | 骑行路线规划服务，提供按照起、终点进行骑行路线的功能         |
| `AMap.DragRoute`          | 拖拽导航插件，可拖拽起终点、途经点重新进行路线规划           |
| `AMap.ArrivalRange`       | 公交到达圈，根据起点坐标，时长计算公交出行是否可达及可达范围 |
| `AMap.Geocoder`           | 地理编码与逆地理编码服务，提供地址与坐标间的相互转换         |
| `AMap.CitySearch`         | 城市获取服务，获取用户所在城市信息或根据给定IP参数查询城市信息 |
| `AMap.IndoorMap`          | 室内地图，用于在地图中显示室内地图                           |
| `AMap.MouseTool`          | 鼠标工具插件                                                 |
| `AMap.CircleEditor`       | 圆编辑插件                                                   |
| `AMap.PolygonEditor`      | 多边形编辑插件                                               |
| `AMap.PolylineEditor`     | 折线编辑器                                                   |
| `AMap.MarkerCluster`      | 点聚合插件                                                   |
| `AMap.RangingTool`        | 测距插件，可以用距离或面积测量                               |
| `AMap.CloudDataSearch`    | 云图搜索服务，根据关键字搜索云图点信息                       |
| `AMap.Weather`            | 天气预报插件，用于获取未来的天气信息                         |
| `AMap.RoadInfoSearch`     | 道路信息查询，已停止数据更新，反馈信息仅供参考               |
| `AMap.HeatMap`            | 热力图插件                                                   |

### 2.3 地图生命周期

1. 创建：`const map = new AMap.Map("container")`
2. 创建完成，加载地图资源，会触发 `complete` 事件：`map.on("complete", () => {})`
3. 销毁：`map.destroy()` ，执行后会销毁地图对象，释放内存

## 3. Map

地图对象类，封装了地图的属性设置、图层变更、事件交互等接口的类。

> 参数和方法详情见[AMap.Map](https://lbs.amap.com/api/jsapi-v2/documentation#map)

### 3.1 参数

```javascript
const map = new AMap.Map(div: (String | HTMLDivElement), opts?: MapOptions);
```

1. `div` ：当参数类型为 `String` 时，内部会查找对应 `id` 等于该参数值的 `dom` 节点。

2. `opts` ：`MapOptions` 地图初始化参数。

`opts:MapOptions` 主要参数如下：

| Name                                                         | Description                                                  |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| `center: ([Number, Number] | LngLat)`                        | 初始中心经纬度                                               |
| `zoom: Number`                                               | 地图显示的缩放级别，可以设置为浮点数；若center与level未赋值，地图初始化默认显示用户所在城市范围。 |
| `rotation: Number = 0`                                       | 地图顺时针旋转角度，取值范围 [0-360] ，默认值：0             |
| `pitch: Number = 0`                                          | 俯仰角度，默认 0，最大值根据地图当前 zoom 级别不断增大，2D地图下无效 。 |
| `viewMode: String = '2D'`                                    | 地图视图模式, 默认为‘2D’，可选’3D’，选择‘3D’会显示 3D 地图效果。 |
| `features: Array<String> = ['bg','point','road','building']` | 设置地图上显示的元素种类, 支持'bg'（地图背景）、'point'（POI点）、'road'（道路）、'building'（建筑物） |
| `layers: Array<Layer>`                                       | 地图图层数组，数组可以是图层 中的一个或多个，默认为普通二维地图。 当叠加多个 [图层](https://lbs.amap.com/api/jsapi-v2/documentation#tilelayer) 时，普通二维地图需通过实例化一个`TileLayer`类实现。 如果你希望创建一个默认底图图层，使用 `AMap.createDefaultLayer()` |
| `zooms: [Number, Number] = [2,20]`                           | 地图显示的缩放级别范围, 默认为 [2, 20] ，取值范围 [2 ~ 20]   |
| `dragEnable: Boolean = true`                        | 地图是否可通过鼠标拖拽平移, 默认为 true。此属性可被 `setStatus/getStatus` 方法控制 |
| `zoomEnable: Boolean = true`                        | 地图是否可缩放，默认值为 true。此属性可被 `setStatus/getStatus` 方法控制 |
| `jogEnable: Boolean = true`                         | 地图是否使用缓动效果，默认值为true。此属性可被`setStatus/getStatus` 方法控制 |
| `pitchEnable: Boolean = true`                       | 是否允许设置俯仰角度, 3D 视图下为 true, 2D 视图下无效。      |
| `mapStyle: String`                                            | 设置地图的显示样式，目前支持两种地图样式： 第一种：自定义地图样式，如 "`amap://styles/d6bf8c1d69cea9f5c696185ad4ac4c86`" 可前往地图自定义平台定制自己的个性地图样式； 第二种：官方样式模版,如"`amap://styles/grey`"。 其他模版样式及自定义地图的使用说明见开发指南 |
| `rotateEnable: Boolean = true`                      | 地图是否可旋转, 图默认为true                                 |
| `showBuildingBlock: Boolean = true`                 | 是否展示地图 3D 楼块，默认 true                              |
| `skyColor: String | Array<Number>`                          | 天空颜色，3D 模式下带有俯仰角时会显示                        |

### 3.2 方法

| Name                 | Description          | Parameters                                                   |
| -------------------- | -------------------- | ------------------------------------------------------------ |
| `resize()`           | 重新计算容器大小     | -                                                            |
| `setCenter()`        | 重新设置中心点       | `center：number[] | LngLat; "中心点经纬度"`<br />` immediately: boolean = false; "是否立即定位到目标位置（无动画）"`<br />` duration?: number; "过渡动画时长，单位 ms"` |
| `setZoom()`          | 重新设置缩放         | `zoom：number; "地图缩放层级"`<br />` immediately: boolean = false; "是否立即定位到目标位置（无动画）"`<br />` duration?: number; "过渡动画时长，单位 ms"` |
| `setZoomAndCenter()` | 重新设置中心点和缩放 | `center：number[] | LngLat; "中心点经纬度"`<br />`zoom：number; "地图缩放层级"`<br />` immediately: boolean = false; "是否立即定位到目标位置（无动画）"`<br />` duration?: number; "过渡动画时长，单位 ms"` |
| `getCenter()`        |                      |                                                              |
| `getZoom()`          |                      |                                                              |
| `getSize()`          |                      |                                                              |
| `getContainer()`     |                      |                                                              |
| `addLayer()`         |                      |                                                              |
| `setLayers()`        |                      |                                                              |
| `getLayers()`        |                      |                                                              |
| `setZooms()`         |                      |                                                              |
| `getZooms()`         |                      |                                                              |
| `setMapStyle()`      |                      |                                                              |
| `getMapStyle()`      |                      |                                                              |
| `getAllOverlays()`   |                      |                                                              |
| `setFitView()`       |                      |                                                              |
| `clearMap()`         |                      |                                                              |
| `destory()`          |                      |                                                              |

### 3.3 事件

| Name       | Description |
| ---------- | ----------- |
| `complete`   | 地图资源加载完成后触发事件 |
| `resize`    | 地图容器尺寸改变事件 |
| `click` | 鼠标左键单击事件 |
| `dblclick` | 鼠标左键双击事件 |
| `mapmove` | 地图平移时触发事件 |
| `movestart` | 地图平移开始时触发 |
| `moveend` | 地图移动结束后触发，包括平移，以及中心点变化的缩放。如地图有拖拽缓动效果，则在缓动结束后触发 |
| `zoomchange` | 地图缩放级别更改后触发 |
| `zoomstart` | 缩放开始时触发 |
| `zoomend` | 缩放结束时触发 |
| `rightclick` | 鼠标右键单击事件 |
| `dragstart` | 开始拖拽地图时触发 |
| `dragging` | 拖拽地图过程中触发 |
| `dragend` | 停止拖拽地图时触发。如地图有拖拽缓动效果，则在拽停止，缓动开始前触发 |
| `touchstart` | 触摸开始时触发事件，仅适用移动设备 |
| `touchmove` | 拖拽地图过程中触发，仅适用移动设备 |
| `touchend` | 触摸结束时触发事件，仅适用移动设备 |







