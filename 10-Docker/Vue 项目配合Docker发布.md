## 1. Docker 介绍

**Docker** 是一个基于 **GO** 语言和 **Linux** 内核的虚拟化容器技术，遵从 Apache2.0 协议开源。

**Docker** 与虚拟机给人的感觉比较相似，但是两者的实现原理不同：Docker 是虚拟化操作系统，而虚拟机则是虚拟化硬件设备。Docker 可利用 Linux 内核来创建独立的 Linux 容器，只占用一组与操作系统隔离的进程，就可以创建一个内部环境保持不变的容器。这种方式也更加利于项目迁移和运行，并且相比虚拟机，也省去了大量的系统配置和资源占用。

## 2. Docker 安装

windows 环境下安装 Docker 需要安装桌面端，直接在 [Docker - Get Started](https://www.docker.com/get-started/) 页面下载对应的 **Docker Desktop** 安装包安装即可。

## 3. Docker 基本操作

因为 Docker 是一种虚拟化容器技术，所以最常用的操作就是“**容器**”「**Container**」的操作；另外容器的创建也需要一个基础的创建模板，这个模板就是“**镜像**”「**Image**」。

这里简单介绍一下与镜像和容器相关的几个基本操作：

```shell
# docker拉取镜像，例如 docker pull nginx:1.21.6
docker pull 镜像别名:版本号
# 删除镜像，例如 docker rmi nginx:1.21.6
docker rmi 镜像id/镜像name
# 查看镜像列表
docker images

# 查看容器列表, 不加-a查看正在运行的，加上-a查看所有容器
docker ps -a
# 启动容器
#（-d 后台运行, --name 容器别名, -p 宿主机端口:容器端口, --network 桥接网络别名, 最后是镜像名称:镜像版本）
docker run -d  --restart always --name vue-app-container -p 3006:3006 vue-app:1.0.0
# 关闭一个已启动容器，例如 docker stop vue-app-container
docker stop 容器ID/容器别名
# 启动一个关闭的容器 ，例如 docker start vue-app-container
docker start 容器ID/容器别名
# 删除容器，例如 docker rm vue-app-container
docker rm 容器ID/容器名
# 查看一个容器的详情 ，例如 docker inspect vue-app-container
docker inspect 容器ID/容器别名
# 进入容器内部，例如 docker exec -it vue-app-container /bin/bash
docker exec -it 容器ID/容器别名 /bin/bash
```

## 4. Vue 应用镜像

> 这里不论是 Vue 应用还是 React 之类的应用，都可以用这样的方式发布；Vite 和 Webpack 也可以不做区分

首先，Vue 之类的单页应用，不论是用 Vite 还是 Webpack，都需要将对应的项目代码打包成普通的 js、css 等文件，最后通过 Nginx 等进行发布。

所以，创建单页应用镜像的第一步就是打包。

Docker 创建镜像的方式有：

1. 基于远程 pull 的镜像创建
2. 本地导入镜像（也可以看做是直接使用）
3. 基于 Dockerfile 创建（最常用的创建方式）

### 4.1 Dockerfile 配置文件

> ### 什么是 Dockerfile？
>
> Dockerfile 是一个用来构建镜像的文本文件，文本内容包含了一条条构建镜像所需的指令和说明。
>
> <p align='right'>---摘自“菜鸟教程”</p>

**Dockerfile** 文件的第一行命令，都是 **FROM** 命令，表示依赖的镜像。因为我们创建的镜像基本上都不会从0开始，最低都会依赖一个系统镜像。

文件内每条执行命令都以一个关键词作为开始，常用命令有：

1. **FROM**： 依赖镜像
2. **RUN**：需要执行的 shell 命令
3. **COPY**：文件复制命令
4. **CMD**：镜像容器运行时执行的命令
5. **ENV**：环境变量，一般会在 Dockerfile 文件内部预先定义
6. **ARG**：构建参数，类似环境变量，仅在 build 镜像时定义
7. **VOLUME**：需要挂载的数据卷，将容器内的某个数据卷映射为宿主机的磁盘位置，可以避免容易过大或者数据丢失
8. **EXPOSE**：仅声明使用端口，只有在运行容器时没有指定端口的时候自动映射到这里指定的端口

### 4.2 编写 Nginx 配置文件

在构建 Docker 镜像时，虽然可以执行一些命令，但是基本上不会通过命令来创建一个 nginx 配置文件。所以，我们需要在项目目录中创建一个 **nginx.conf** 文件。

```
### :::
### 服务器 nginx 配置，请勿改变 listen 端口
### :::
server {
    listen       80;
    server_name  localhost;

    root   /usr/share/nginx/vue-app;

    location / {
        try_files $uri $uri/ /index.html;
        index  index.html index.htm;
    }

    # 接口转发
    location ~* ^\/(sys|app)\/ {
       proxy_pass                 http://app-server:8080;
       proxy_redirect             off;
       proxy_set_header           Host $host;
       proxy_set_header           X-Real-IP $remote_addr;
       proxy_set_header           X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

> 这个 nginx.conf 文件仅作为示例，需要根据实际情况修改。

### 4.3 构建镜像

在执行镜像构建命令之前，我们需要在根目录下创建一个 Docker 配置文件 **Dockerfile**

```dockerfile
# 配置 nginx 资源转发, alpine 为纯净版本
FROM nginx:1.21.6

# 服务器环境
COPY dist/ /usr/share/nginx/hwiot-web/

COPY nginx.conf /etc/nginx/conf.d/default.conf
```

这个文件仅仅是将外部打包后的 **dist** 文件夹里面的内容，复制到容器内的 **/usr/share/nginx/vue-app/** 内，在复制 **nginc.conf** 文件到 **/etc/nginx/conf.d/default.conf** 作为默认 Nginx 配置。

之后执行构建命令：

```shell
docker build -t vue-app:1.0.0 .
```

注意后面的 **.** 

这一步会默认在当前目录查找 **Dockerfile** 文件并进行镜像构建，并且用 **-t** 指定镜像名和镜像版本号。

## 5. 创建容器与启动

在上一步镜像创建完成之后，就可以根据该镜像创建容器了。

```shell
docker run -p 80:80 -d -name vue-app-container vue-app
```

这里指定了将容器的 80 端口映射到宿主机的80,端口，这样我们直接在本地打开浏览器访问 **http://localhost** 即可。
