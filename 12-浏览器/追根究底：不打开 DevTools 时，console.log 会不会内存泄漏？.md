# 追根究底：不打开 DevTools 时，console.log 会不会内存泄漏？

---

作者：R·ex / Zeng（rexskz）
链接：https://blog.rexskz.info/getting-to-bottom-will-console-log-cause-memory-leak-when-devtools-is-off.html
来源：https://blog.rexskz.info/
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

---

> TL;DR：会。并且虽然 Chromium 有试图做限制，但因为方法不合适所以并没能解决问题。

JavaScript 的内存泄漏原因有很多，例如 DOM、计时器、闭包、意外的全局变量，以及本文的主题：`console.log`。关于 `console.log` 会不会造成内存泄漏，掘金上面有大佬发过两篇文章：

-   [千万别让 console.log 上生产！用 Performance 和 Memory 告诉你为什么](https://juejin.cn/post/7185128318235541563)
-   [console.log 一定会导致内存泄漏？不打开 devtools 就不会](https://juejin.cn/post/7185501830040944698)

这两篇文章的结论是：在打开 DevTools 时一定有泄漏（文中的代码很显然可以证明），但如果没打开 DevTools，似乎就不会有问题了（文中 `performance` 的数据也可以证明）。

但我结合自己之前的经验，产生了一个疑惑：如果不会造成内存泄漏，说明对象被 GC 掉了，那我为什么在打开 DevTools 后还能看到打开之前 log 的对象呢？这些对象肯定被存到了一个地方，肯定还占据着内存。于是本着追根究底的精神，我决定通过实验、猜想、追踪代码求证等方式来得到答案。

可以复现的内存泄漏
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

其实在文章的评论区有人就指出：只要每次 log 的是不同的对象，不管是否打开 DevTools 都会内存溢出。我这里以一个长度为 1 M 的 `number` 数组为例，简单修改一下文中的代码：

本来我是打算用操作系统的任务管理器来查看内存占用的，但为了避免其它进程以及操作系统的内存压缩、虚拟内存的影响，我最终打开了 Chrome 自己的任务管理器。

可以看出，页面上输出的 `usagedMemory` 始终是 9，但 Chrome 的任务管理器里面这个 Tab 的内存占用却一直在往上涨，直到用到 3.4~3.6 GB 时页面崩溃。之后我关掉任务管理器重试，页面依旧会崩溃，所以一定是因为“超过了内存限制”，而不是“任务管理器的观测会造成内存泄漏”。

![test.html 耗费了 3.4 GB 内存](https://static.rexskz.info/blog/article/getting-to-bottom-will-console-log-cause-memory-leak-when-devtools-is-off/0.png "test.html 耗费了 3.4 GB 内存")

![即使不开 DevTools 页面也会崩溃](https://static.rexskz.info/blog/article/getting-to-bottom-will-console-log-cause-memory-leak-when-devtools-is-off/1.png "即使不开 DevTools 页面也会崩溃")

光是凭借这个例子就足以证明，即使不打开 DevTools 也会造成内存泄漏。并且可以发现 `console.log` 打印的数据并不在 `performance.memory.totalJSHeapSize` 的管辖范围内。那它们去了哪里呢？我把目光看向了 Chromium 的源代码。

静态代码追踪
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

作为一个对速度要求极高的程序，Chromium 的大部分内容（包括 v8）是用 C++ 写的。追踪代码首先要能看到代码，虽然我可以将仓库 clone 下来本地追踪，但其项目过大，clone 需要一些时间，且会对我的 IDE 造成不小的压力。一个更好的方法是通过官方提供的 [Chromium Code Search](https://source.chromium.org/) 页面来搜索代码、跟踪跳转。

一开始，我试图在 [The Chromium Projects](https://www.chromium.org/Home/) 页面寻找项目结构相关的文档，目的是直接找到 `console` API 所在的目录，但无果，因此只能直接搜索代码。考虑到 `console.log` 可能会被转化为看似完全不相干的 C++ 函数调用，且这个函数调用过于通用，可能会搜到很多文档注释相关的东西，于是我转而去搜索 `console info`，因为按照经验它一定会跟 `console.log` 的实现在同一个模块下，并且它并不经常出现。

运气不错，第一个结果看起来就很接近目标了：

![第一个结果就可能是我想要的](https://static.rexskz.info/blog/article/getting-to-bottom-will-console-log-cause-memory-leak-when-devtools-is-off/2.png "第一个结果就可能是我想要的")

文件是 `v8/src/inspector/v8-console.h`，按照 C++ 的项目规范，`.h` 文件一般只有 declaration 而不是 implementation（网站里叫 definition），因此先点进去，然后依次单击代码中的 `Log` 符号、弹出窗口中唯一一条 Definition 结果，右边新的弹窗就是我们要找的函数了，如下图所示。

![追代码的过程](https://static.rexskz.info/blog/article/getting-to-bottom-will-console-log-cause-memory-leak-when-devtools-is-off/3.png "追代码的过程")

这只是第一步，顺着这个思路，可以追踪到 `reportCall`，然后是 `V8ConsoleMessageStorage::addMessage` 方法，在函数的结尾将参数 `message` 追加到了一个 `vector`（C++ STL 提供的可变长度的数组）的末尾（[传送门](https://source.chromium.org/chromium/chromium/src/+/main:v8/src/inspector/v8-console-message.cc;l=582;drc=72872c69b10ffece95fc8a429ea8b3bd502e0526;bpv=1;bpt=1)）：

至于 `m_messages`，则是 `V8ConsoleMessageStorage` 这个 class 的一个成员变量，而这个 class 的实例是跟着 v8 isolates 走的，并且只有用到的时候才创建，例如调用 `console.log` 时。关于什么是 v8 isolates，Cloudflare 有一段 [很好的解释](https://developers.cloudflare.com/workers/learning/how-workers-works/#isolates)：

> V8 orchestrates isolates: lightweight contexts that provide your code with variables it can access and a safe environment to be executed within. You could even consider an isolate a sandbox for your function to run in.  
> V8 引擎将 isolate 作为轻量级的上下文，为你的代码提供变量访问和安全的执行环境。你甚至可以将 isolate 视为你的函数运行的沙盒。

原来是存在了 v8 相关的实例里面，那 `performance` API 拿不到似乎也情有可原了。

Chromium 中失效的限制
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

值的留意的是，刚刚追踪到的代码在 `push_back` 之前其实有一个小判断：

可以看出，Chromium 对 `m_messages` 可以存放的总预估体积（`estimateSize`，可能不准确）做了限制，如果超出了这个限制，最早放入 `m_messages` 中的消息将被删除。这个限制的定义是 `maxConsoleMessageV8Size = 10 * 1024 * 1024`，也就是……10 MB？？

这个值我觉得过于小了，我们的测试代码每 50 ms 会产生至少 1 MB 内存，即使预估再不准确，应该也很快就会超过这个限制才对。难道是限制失效了？但通过静态分析代码我已经没有太多头绪了，说不定动态调试可以帮我了解更多的细节。

动态调试
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

四年前我有个机会自己编译并简单（通过输出日志的方式）调试了 Chromium 项目（[文章传送门](https://blog.rexskz.info/chrome-source-code-analyse-experience.html)），凭借着那次经历，我决定再试一次。

编译 Chromium（再次）
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

由于年代久远，我又一次打开了 The Chromium Projects 的指南。不同的是这次我没有在 Ubuntu 虚拟机上搞，而是直接用了 Mac 系统，因此需要查看 Mac 对应的文档：[Checking out and building Chromium for Mac](https://chromium.googlesource.com/chromium/src/+/main/docs/mac_build_instructions.md)。关键的几步是：

只要能看到下面这个界面，就说明编译没问题，你已经有一个自己的 Chromium 啦！

![自己编译并运行的 Chromium](https://static.rexskz.info/blog/article/getting-to-bottom-will-console-log-cause-memory-leak-when-devtools-is-off/4.png "自己编译并运行的 Chromium")

简单的调试方法
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

在之前的经历中，我通过 `LOG` 宏来打印自定义的数据，通过 `base::debug::StackTrace().Print()` 打印堆栈以确认调用链路。但这次似乎不太一样了——`LOG` 的说明文档没有了，并且我直接调用会报编译错误；打印堆栈也是直接报编译错误，说找不到 `StackTrace` 方法。

凭借一点点 C++ 的知识，我发现在 `v8` 这个 namespace 里，这两个东西都是被重定义了——

-   `LOG` 在 `v8/src/logging/log.h` 里面被重定义，需要提供 v8 isolate，但 `V8ConsoleMessageStorage` 是 `contextGroup` 级别的 class，没法提供具体某一个 context 的 isolate。因此我只好先用 `std::cout` 临时代替一下。
-   `debug` 在 `v8` 这个 namespace 下也被重新实现了一次，需要用 `v8::base::debug::StackTrace().Print()` 来代替。

运行并查看结果
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

首先我在 `V8ConsoleMessageStorage::addMessage` 里面打印一下堆栈，确认了之前代码追踪的结果，确实是经过这条调用链路进来的。

那么为什么代码中的限制不生效呢？我在限制附近加了一段 log 来分析原因：。

结果发现，这个循环根本就没进去，因为 `message->estimatedSize()` 的大小始终是 50！想要超过 `maxConsoleMessageV8Size` 这个 10485760 的限制实在是过于困难了。

明明我 log 的对象里面有一个很长的字符串，为什么预估大小只有 50 呢？看来 `estimatedSize` 可能有点问题。点进去一看，发现它取的是实例内部的 `m_message` 的长度：

不合适的取值来源
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

从代码中可以发现，在 `V8ConsoleMessage` 类中，`m_message` 只是一个 `String16` 类型（定义在 [v8/src/inspector/string-16.h](https://source.chromium.org/chromium/chromium/src/+/main:v8/src/inspector/string-16.h)，其实就是 UTF-16 的一个 C++ 实现），实际的值（类型是 `v8::Value`）其实存在一个 private 属性中：

经过简单查看，`m_message` 其实就是 log 里面出现的 `"[object Object]"`，自然长度固定。那么如果我 log 的不是对象，而是只有一个长字符串呢？我简单改了一下代码（为了避免被刷屏，我特地改小了消息体，只有 10 的长度）：

果然，预估大小变了，每条消息大概在 400 左右：

值得注意的是，虽然 `m_message` 字段看起来像是对 log 的值做 `toString()` 之后的结果，但实际上并不是。通过追踪代码可以看到 `V8ConsoleMessage::createForConsoleAPI` 函数（[传送门](https://source.chromium.org/chromium/chromium/src/+/main:v8/src/inspector/v8-console-message.cc;l=454;drc=45c34b77147f1b5ffb1d55c693c067f4f2a74f6f;bpv=1;bpt=1)）和 `V8ValueStringBuilder::append` 函数（[传送门](https://source.chromium.org/chromium/chromium/src/+/main:v8/src/inspector/v8-console-message.cc;l=93;drc=45c34b77147f1b5ffb1d55c693c067f4f2a74f6f;bpv=1;bpt=1)）的实现，最终定位到了 [这里](https://source.chromium.org/chromium/chromium/src/+/main:v8/src/inspector/v8-console-message.cc;l=118-124;drc=45c34b77147f1b5ffb1d55c693c067f4f2a74f6f;bpv=1;bpt=0)：

也就是类似于 JavaScript 里面的 `Object.prototype.toString.call` 的效果。可以使用下面这段 JavaScript 代码来验证——虽然在 JavaScript 里面强转 `string` 的结果是 `"Rex Zeng is the greatest alive"`，但 `std::cout` 的结果依旧是 `"[object Object]"`：

自此可以得出结论：Chromium 对 `console.log` 总大小限制失效的原因，是因为其在判断时没有使用合适的方式，导致预估大小与实际大小严重不符。

那么——该不该用 console.log？
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

本文只是在讨论“不打开 DevTools 时 `console.log` 是否还会造成内存泄漏”，至于在生产环境使用 `console.log` 的合理性不在讨论范围中。事实上对于大多数页面，log 打多打少并没有太大影响，而对于可能需要常开的页面（如 Telegram Web、企业监控大屏），内存占用的不断飙升最终会导致页面崩溃，这就必须要注意了。

如果因为一些原因，希望避免在生产环境使用 `console.log`，可以用 ESLint 帮助开发养成习惯，也可以通过编译器插件直接在 `NODE_ENV === 'production'` 时去除相关的代码。

> 版权声明：除文章开头有特殊声明的情况外，所有文章均可在遵从 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh) 协议的情况下转载。