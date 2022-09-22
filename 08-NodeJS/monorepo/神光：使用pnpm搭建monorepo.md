

monorepo可以使用lerna,也可以使用更简洁的yarn、pnpm,但是pnpm相对于yarn包管理机制更加强大完善，所以此文章主要是简单实操一下pnpm实现monorepo

#### 起步

新建一个pnpm-workspace.yaml，这个文件定义了 工作空间的根目录，并能够使您从工作空间中包含 / 排除目录 。 默认情况下，包含所有子目录。

```
packages:
  # 所有在 packages/  子目录下的 package
  - 'packages/**'
  # 不包括在 test 文件夹下的 package
  - '!**/test/**'
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ddabe48d13144042a1a69ede001dc18e~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)

然后我们就可以在packages里创建多个项目，此例中创建http,utils,web,server四个项目

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fe5c3f5092ba4984868a3c481c972717~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)

#### 安装全局依赖

首先全局安装pnpm

`npm i pnpm -g`

安装四个项目通用库typescript

`pnpm i typescript`

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/87b98d8991e7478fbb1698e6ca79167e~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?) 会报错问你是不是需要安装到根目录的文件，需要的话使用-w(--workspace-root)

`pnpm i typescript -w`

安装公共开发依赖

`pnpm i typescript -w -D`

可以看出得益于pnpm的包管理机制，node\_modules下面只展示了typescript，typescript的相关依赖包完全没展示在其中，全都展示在了.pnpm里面，这样完全通过软链接的形式指向真实的地址，简洁分明，避免了互相依赖的情况。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2ed6e5e906c646f0a723684859df4c3d~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)

#### 安装局部依赖

对于局部依赖，最简单的办法就是cd packages/http

`pnpm install axios`

参照pnpm官网提供了根目录执行的命令 首先切到指定包http进行`pnpm init -y`初始化,包名一般都通用为命名空间+项目名，这里命名为@monorepo/http,必须要命名，不然pnpm add --filter的时候找不到添加包的项目目录

`pnpm add express --filter @monorepo/http`

#### 安装项目内互相依赖

比如web需要依赖http的功能用于请求，那么这个时候需要互相依赖,为了让依赖实时更新最新版本，才用通配符更新版本

`pnpm add @monorepo/http@* --filter @monorepo/web`

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/af24fa27ccd74832b0b095852db74323~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?) 通过通配符的看上去workspace是局部依赖，`pnpm publish`会转成真实路径依赖 通过上面的模式基本的组件库的基本模型就搭建上.

#### 常用monorepo pnpm命令

能够列出这个包的源码位置，被monorepo内部哪些项目引用了。

```
pnpm why -r
```

取消某个依赖的安装

```
pnpm remove axios

pnpm remove axios --filter  @monorepo/http
```

本地link文件，和npm link用法一致

```
pnpm link --global
pnpm link --global <pkg>
```

本地解绑文件

```
### --recursive, -r[](https://pnpm.io/zh/cli/unlink#--recursive--r "直接链接到此标题")

取消链接在所有子目录中、或当在 [workspace](https://pnpm.io/zh/workspaces) 中执行命令时所有 workspace 的 `packages` 中找到的所有 `package` 。

### --filter <package_selector>

```

