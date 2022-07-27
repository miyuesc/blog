# 搭建 Vite + Vue 3 + TypeScript 的基础项目模板

## 前言

`Vue 3` 发布到现在已经一年多了，目前的版本也到了 `3.2.37`，`Vue` 相关的周边生态也陆续发布了自己的稳定版本，所以是时候开始学习和使用 `Vue 3.0` 了。

> 这里作者也算是炒个冷饭，简单的讲讲自己搭建一个后台管理项目模板的时候遇到的一些问题。

## 主要内容

1. `Vite` 使用与常用配置项
2. `TypeScript` 集成
3. `Vue` 周边生态：`Router` 与 `Pinia`
4. `eslint` 和 `prettier` 代码格式与代码检查
5. 依赖自动引入与组件库 `Naive UI`

## 1. 创建项目

### 1.1 按步骤选择依赖创建

> 后面的内容都使用 `npm` 作为包管理工具，建议使用 `vite CLI` 直接初始化项目

首先，先在本地找一个“宽敞”的目录，并在该目录下打开命令行（ `windows` 系统可以直接在资源管理器地址栏输入 `cmd` 进入命令行界面）。

```shell
npm init vite@latest
# or
npm create vite@latest
# or
yarn create vite
# or
pnpm create vite
```

如果没有安装 `vite`，`npm` 也会自动下载。

![img.png](img.png)

之后则是键入项目名称，并选择相应的库或者框架。

![img_1.png](img_1.png)

选择 `TypeScript`，并结束创建过程。

![img_3.png](img_3.png)

### 1.2 使用附加命令直接创建

```shell
# npm 6.x
npm create vite@latest my-vue-app --template vue-ts

# npm 7+, extra double-dash is needed:
npm create vite@latest my-vue-app -- --template vue-ts

# yarn
yarn create vite my-vue-app --template vue-ts

# pnpm
pnpm create vite my-vue-app --template vue-ts
```

`Vite` 官方文档也提供了多个预设模板，可以通过附加命令 `--template` 来指定需要使用的模板项目。

当前预设模板有：

-   `vanilla`
-   `vanilla-ts`
-   `vue`
-   `vue-ts`
-   `react`
-   `react-ts`
-   `preact`
-   `preact-ts`
-   `lit`
-   `lit-ts`
-   `svelte`
-   `svelte-ts`

---

到这里一个基础的 `vite` + `vue` + `ts` 的项目就创建完成了。该项目当前包含以下内容：

![img_4.png](img_4.png)

如果仅作为个人学习使用，到这里就可以算基本结束了，可以直接使用该项目执行 `npm install` 下载依赖并启动，进行后续的开发。

> 📌 Tips:
> 
> 官方推荐使用 `vs code` 搭配 `volar` 插件进行开发。

## 2. 