# Axios封装--优化页面Loading效果

## 前言

最近老是做后台项目，很多页面需要同时请求多个数据，并且为了统一 loading 样式和加载效果、避免多个请求发起和结束之间有细微间隔导致 loading 闪烁的情况，所以就改造了一下 Axios 的封装，在拦截器中增加全屏 Loading 的处理。

## 1. 目标效果

根据目前的项目需求，总结了以下场景和对应要求：

- 在请求时开启 Loading 效果，请求结束时关闭；

- 如果有多个请求，则尽量保证多个请求间隔不会存在闪烁，也不会添加多个 Loading 效果；

- 可以配置是否开启全屏 Loading

第一眼看到这个需求，就想到的肯定有防抖，用来实现一个时延效果，避免首次加载时可能出现的闪烁；但是在第一次请求开启 Loading 之后如何保证在关闭时就是最晚结束的请求呢？

这里我采用的方案就是通过一个数组长度来控制。

## 2. 方案实现

首先，是编写一个 **request.js** 文件，引入 Axios 和 ElementUI 的 Loading 组件，并初始化一个数组和 loading 组件实例。

```javascript
import axios from "axios";
import { Loading } from "element-ui";


let loadingInstance;
const LoadingOpts = {
  text: "加载中，请稍后......"
};

const RequestStack = [];
let RequestId = 0; // 也可以不用
```

> 这里我定义了一个自增式的ID，用来标识当前的请求，也可以取消，对实际逻辑没有影响。

然后，我们再通过 **lodash** 提供的 **debounce** 防抖函数，封装一个 Loading 的关闭方法。

```javascript
import { debounce } from "lodash";

const closeLoading = debounce(() => {
  if (!RequestStack.length) {
    loadingInstance && loadingInstance.close();
    loadingInstance = null
  }
}, 100);
```

> 只有当此时的请求数组的长度为 0 的时候，才关闭 Loading 效果。
>
> 因为在 Node 的模块环境下，一个 js 文件就相当于一个模块，只要没有导出，内部的变量就是相对安全的；所以 **RequestStack** 的操作和长度基本不会被外界改变，可以确保该数组长度就是请求中的 http 请求个数；当长度为 0 时，那肯定就是没有 http 请求，需要关闭 Loading 了。
>
> 而增加防抖操作，也是为了避免有些同步请求的操作导致的闪烁。

最后，就是增加 axios 的拦截器配置，在发起时向数组中插入一个元素，在结束时（异常、正常等）删除一个元素，并调用 closeLoading 关闭加载效果。

```javascript
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  // 开启 Loading
  if (config.fullscreen) {
    !loadingInstance && (loadingInstance = Loading.service(LoadingOpts))
    RequestStack.push(RequestId++);
  }
  return config;
}, function (error) {
  // 发生错误时清除一个元素
  RequestStack.pop();
  closeLoading();
  return Promise.reject(error);
});

// 添加响应拦截器，不管成功还是失败都需要关闭 loading
axios.interceptors.response.use(function (response) {
  RequestStack.pop();
  closeLoading();
  return response;
}, function (error) {
  RequestStack.pop();
  closeLoading();
  return Promise.reject(error);
});
```

## 3. 总结

总的来说，这个方案原理很简单：通过闭包来实现多个请求时数量的统一和 CloseLoading 的正确时机。但是也有一些问题，比如有些大数据请消耗大量时间，或者请求间隔大于100ms，一样有可能影响用户体验，实际的加载动画效果依然要根据项目情况来进行调整。

最后一句话，闭包真好用~~~