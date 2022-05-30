## TCP/IP协议：TCP: Transmission Control Protocol 传输控制协议；IP: Internet Protocol 网际协议。

tcp：应用程序间的通信

ip: 计算机之间的通信

两者协同，有上下层次。tcp负责应用软件与网络软件之间的通信，ip负责计算机之间的通信。

即 应用 -> tcp -> ip -> 网络计算机 -> ip > tcp -> 应用



## Http: 超文本传输协议，应用层协议，无状态协议，是一种用于分布式、协作式和超媒体信息系统的应用层协议。

是基于 TCP 实现的应用层协议，由请求和响应构成，一个标准的客户端服务器（B/S）模型，只能是客户端发起，服务器响应。

无状态：B与S不需要持久连接，默认响应结束即关闭。

一次 Http 操作称为一个事务。

### 工作流程：

1. 地址解析(协议://主机:端口/资源路径?参数)
2. 封装 http 请求包
3. 封装成 tcp 包
4. tcp 三次握手建立连接
5. Client 发送请求
6. Server 响应请求
7. Server 关闭 TCP 连接

> Client/Server 在请求头添加 Connection:keep-alive 可以保持 TCP 的打开状态,节省请求建立连接的时间和网络带宽



### 报文格式:

```
1. HTTP 1

请求报文:

请求方法 URL HTTP/版本号
请求首部字段(可选)
空行
body(只对Post请求有效)

example:
GET http://m.baidu.com/ HTTP/1.1
Host m.baidu.com
Connection Keep-Alive
...// 其他header

key=iOS


响应报文:

HTTP/版本号 返回码 返回码描述
应答首部字段(可选)
空行
body

example:
HTTP/1.1 200 OK
Content-Type text/html;charset=UTF-8
...// 其他header

<html>...
```



## 报文字段:

- 请求报文字段
- 应答报文字段
- 实体首部字段
- 通用报文字段
- 其他报文字段



### 请求报文字段:

```
Accept：客户端能够处理的媒体类型, 如: text/html, application/xml; q=0.9, */*

Accept-Charset: 表示客户端支持的字符集, 如：Accept-Charset: GB2312, ISO-8859-1

Accept-Encoding： 表示客户端支持的内容编码格式, 如：Accept-Encoding：gzip

Authorization：表示客户端的认证信息

Host: 表示访问资源所在的主机名，即URL中的域名部分

...

User-Agent：将发起请求的浏览器和代理名称等信息发送给服务端
```



### 应答报文字段:

```
Age：服务端告知客户端，源服务器（而不是缓存服务器）在多久之前创建了响应。单位为秒。

ETag： 实体资源的标识，可用来请求指定的资源。

...

Location：请求的资源所在的新位置。
```



### 实体首部字段:

```
Allow：通知客户端，服务器所支持的请求方法。但服务器收到不支持的请求方法时，会以405（Method Not Allowed）作为响应。
    
Content-Encoding：告知客户端，服务器对资源的内容编码。
  
Content-Language：告知客户端，资源所使用的自然语言。
  
Content-Length：告知客户端资源的长度
  
Content-Location：告知客户端资源所在的位置。
  
Content-Type：告知客户端资源的媒体类型，取值同请求首部字段中的Accept。
  
Expires：告知客户端资源的失效日期。可用于对缓存的处理。
  
Last-Modified：告知客户端资源最后一次修改的时间。
```



### 通用报文字段:

```
Cache-Control：控制缓存行为；

Connection：管理持久连接，设置其值为Keep-Alive可实现长连接。

Date：创建HTTP报文的日期和时间。

Pragma：Http/1.1之前的历史遗留字段，仅作为HTTP/1.0向后兼容而定义，虽然是通用字段，当通常被使用在客户单的请求中，如Pragma: no-cache, 表示客户端在请求过程中不循序服务端返回缓存的数据；

Transfer-Encoding：规定了传输报文主题时使用的传输编码，如Transfer-Encoding: chunked

Upgrade: 用于检查HTTP协议或其他协议是否有可使用的更高版本。

Via：追踪客户端和服务端之间的报文的传输路径，还可避免会环的发生，所以在经过代理时必须添加此字段。

Warning：Http/1.1的报文字段，从Http/1.0的AfterRetry演变而来，用来告知用户一些与缓存相关的警告信息。
```



### 其他报文字段:

```
Cookie：属于请求型报文字段，在请求时添加Cookie, 以实现HTTP的状态记录。

Set-Cookie：属于应答型报文字段。服务器给客户端传递Cookie信息时，就是通过此字段实现的。

Set-Cookie字段:
    NAME=VALUE：赋予Cookie的名称和值；

    expires=DATE: Cookie的有效期；

    path=PATH: 将服务器上的目录作为Cookie的适用对象，若不指定，则默认为文档所在的文件目录；

    domin=域名：作为Cookies适用对象的域名，若不指定，则默认为创建Cookie的服务器域名；

    Secure: 仅在HTTPS安全通信是才会发送Cookie；

    HttpOnly: 使Cookie不能被JS脚本访问；

    如：Set-Cookie:BDSVRBFE=Go; max-age=10; domain=m.baidu.com; path=/
```



## 常见应答状态码:

1. 100: 还在请求中
2. 2xx: 请求成功
   1. 200 成功处理
   2. 204 成功处理, 但相应部分主体为空
   3. 206 客户端部分请求, 服务端返回指定部分内容
3. 3xx: 请求重定向
   1. 301 资源已有新的 url, 永久重定向
   2. 302 资源已有新的 url, 暂时重定向
   3. 303 同302, 但要求客户端重新发送 get 请求新的 url
   4. 304 与重定向没有关系, 不满足条件
4. 4xx: 客户端错误
   1. 401 请求报文 错误
   2. 402 发送请求需要 http 认证
   3. 403 服务器拒绝资源请求
   4. 404 服务器没有请求的资源
   5. 405 请求方法错误
   6. 413 请求体过大
5. 5xx: 服务端错误
   1. 500 服务器处理请求超时
   2. 502 访问出错
   3. 503 服务器无法处理



http 缺点:

- 通信使用明文，可能被窃听
- 不验证通信方的身份，可能遭遇伪装
- 无法证明报文的完整性，有可能遭遇篡改





## HTTPS: 超文本传输安全协议. 由 http 进行通信, 但会利用 SSL/TLS 来加密数据包.

目的: 提供对网站服务器的身份认证，保护交换数据的隐私与完整性.

TLS: 安全传输层协议Transport Layer Security, 是介于TCP和HTTP之间的一层安全协议, 不影响原有的TCP协议和HTTP协议

https 作用: 数据加密; 建立信息安全通道; 对网站服务器进行身份认证

![img](Untitled/static/1634e5e73936060f)



TLS/SSL的功能实现主要依赖于三类基本算法：散列函数 Hash、对称加密和非对称加密，

其利用非对称加密实现身份认证和密钥协商，对称加密算法采用协商的密钥对数据加密，基于散列函数验证信息的完整性。

![img](1634e5e77c5d7fff)





> TLS的基本工作方式是
>
> 1. 客户端使用非对称加密与服务器进行通信
> 2. 实现身份验证并协商对称加密使用的密钥
> 3. 然后对称加密算法采用协商密钥对信息以及信息摘要进行加密通信
>
> 不同的节点之间采用的对称密钥不同，从而可以保证信息只能通信双方获取。



## HTTPS性能与优化

性能损耗:

1. 增加请求延时
2. 增加 cpu 资源消耗



优化:

1. cdn 接入
2. 会话缓存
3. 硬件加速
4. 远程解密



### 其他



http 默认端口 80

https 默认端口 443



## 请求方法

GET: 通常用来获取资源

HEAD: 获取资源的元信息

POST: 提交数据，即上传数据

PUT: 修改数据

DELETE: 删除资源(几乎用不到)

CONNECT: 建立连接隧道，用于代理服务器

OPTIONS: 列出可对资源实行的请求方法，用来跨域请求

TRACE: 追踪请求-响应的传输路径



### get 与 post 的区别

- 从**缓存**的角度，GET 请求会被浏览器主动缓存下来，留下历史记录，而 POST 默认不会。

- 从**编码**的角度，GET 只能进行 URL 编码，只能接收 ASCII 字符，而 POST 没有限制。

- 从**参数**的角度，GET 一般放在 URL 中，因此不安全，POST 放在请求体中，更适合传输敏感信息。

- 从**幂等性**的角度，`GET`是**幂等**的，而`POST`不是。(`幂等`表示执行相同的操作，结果也是相同的)

- 从**TCP**的角度，GET 请求会把请求报文一次性发出去，而 POST 会分为两个 TCP 数据包，首先发 header 部分，如果服务器响应 100(continue)， 然后发 body 部分。(**火狐**浏览器除外，它的 POST 请求只发一个 TCP 包)



### url 格式与编码

格式:  协议 :// username:password@ host:port path ?query #fragment

编码: 只能使用 ASCII , 中文和特定字符会转义



