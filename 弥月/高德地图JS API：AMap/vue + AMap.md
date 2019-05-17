[pixiv: 65751999]: # 'https://chanshiyu.com/poi/2019/8.jpg'

高德地图在vue中的使用方式

> 由于饿了么团队封装的高德地图组件使用起来不是很方便，而且不仅需要学习vue-amap的文档，也需要学习高德地图的官方文档，使用起来比较麻烦，所以我觉得在项目中直接使用更加方便吧

## 引入高德地图js api

### 第一种方式：直接在index.html页面中添加

首先，在html中引入api.

``` html
    <script src="https://webapi.amap.com/maps?v=1.4.13&key='你自己申请的key'"></script>
    // 这种方式必须在head中引入
```

### 第二种方式：在vue.config.js中采用cdn方式引入，这种方式适用于采用打包优化。

``` javascript
    chainWebpack: function(config) {
        config.plugin("html").tap(args => {
            const cdn ={
                css: [],
                js: [
                    "https://webapi.amap.com/maps?v=1.4.13&key=75f48b43c7cb828ef0b5b34d23af5a7c",
                    "//webapi.amap.com/ui/1.0/main.js"
                ]
            }
            if (process.env.NODE_ENV === "production") {
                args[0].cdn = cdn.build;
            }
            if (process.env.NODE_ENV === "development") {
                args[0].cdn = cdn.dev;
            }
            return args;
        })
    }
```

