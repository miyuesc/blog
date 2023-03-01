# 千万别让 console.log 上生产！用 Performance 和 Memory 告诉你为什么

---

作者：zxg_神说要有光
链接：https://juejin.cn/post/7185128318235541563
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

---

很多前端都喜欢用 console.log 调试，先不谈调试效率怎么样，首先 **console.log 有个致命的问题：会导致内存泄漏。**

为什么这么说呢？

用 Performance 和 Memory 工具分析下就知道了。

我们准备这样一段代码：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6de7d6d5ed2f46e9bc4c9f809bceabe6~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

一个按钮，点击之后创建一个数组，执行一些计算。

很常见的逻辑。

我们最后加了一个 console.log 打印了下这个数组。

起个静态服务：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/41f6ea92ded84e1eba22b4fdc3a94179~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

浏览器访问：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e1052d50626c4897a8dabb75ad7ae14b~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

点击 performance 下的垃圾回收按钮，手动触发一次 GC：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b684736ed5e045c6b85bc764564b18d9~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

勾选 Memory，然后开始录制，点击 3 次按钮，再执行一次 GC：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a97487c30ca6465db0c668e0b297998c~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

你会发现内存是这样的：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3c4f83f666e84d9fb4ef77c06a7b98f3~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

内存占用有三次增长，因为我们点击三次按钮的时候会创建 3 次大数组。

但是最后我们手动 GC 之后并没有回落下去，也就是这个大数组没有被回收。

按理来说，代码执行完，那用的内存就要被释放，然后再执行别的代码，结果这段代码执行完之后大数组依然占据着内存，这样别的代码再执行的时候可用内存就少了。

这就是发生了**内存泄漏，也就是代码执行完了不释放内存的流氓行为。**

有同学说，只是这么一点内存问题不大呀，反正可用内存还很多。

但如果你的代码要跑很长时间，这段代码要执行很多次呢？

每次执行都会占据一部分内存不释放，慢慢的内存就不够用了，甚至会导致程序崩溃。

比如当这段代码执行个 9 次，内存占用就增长了 9 个大数组的内存：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/46b4600005bf41c4981e9d9e44d98c20~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

再多执行几次呢？

是不是就有崩溃的隐患了。

那为啥说是 console.log 导致的呢？

我们来看看不用 console.log 是什么样的：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/415ca1dbec1e4b75bf12e516448c33ae~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

注释掉 console.log，重新跑。

你会发现现在的内存分配情况是这样的：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5451c547800344008bead118df14a509~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

分配了三次内存，但是 GC 后又会落下去了。

这才是没有内存泄漏的好代码。

那为啥 console.log 会导致内存泄漏呢？

因为控制台打印的对象，你是不是有可能展开看？那如果这个对象在内存中没有了，是不是就看不到了？

所以有这个引用在，浏览器不会把你打印的对象的内存释放掉。

有的同学说，那我不打开控制台，是不是就没有这个引用了？

答案是否定的：

![2023-01-05 18.34.31.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/485eed998c7e4a04a57fafc8bfd0c314~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

我点击了几次之后，再打开控制台，依然是可以看到这个对象的，说明没有被 GC。

也就是说**用 console.log 打印对象的代码一定是有内存泄漏的。**

当然，也不只是 console.log 会导致内存泄漏，还有别的 4 种情况：

-   定时器用完了没有清除，那每次执行都会多一个定时器的内存占用，这就是内存泄漏
-   元素从 dom 移除了，但是还有一个变量引用着他，这样的游离的 dom 元素也不会被回收。每执行一次代码，就会多出游离的 dom 元素的内存，这也是内存泄漏
-   闭包引用了某个变量，这个变量不会被回收，如果这样的闭包比较多，那每次执行都会多出这些被引用变量的内存占用。这样引用大对象的闭包多了之后，也会导致内存问题
-   全局变量，这个本来就不会被 GC，要注意全局变量的使用

总之，**全局变量、闭包引用的变量、被移除的 dom 依然被引用、定时器用完了没清除、console.log 都会发生代码执行完了，但是还占用着一部分内存的流氓行为，也就是内存泄漏。**

注意，这里指的是使用完毕后没有回收，在使用期间的内存增长是正常的。

那怎么排查呢？

performance 工具就可以：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7c215d62874544888792618c05df078c~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

点击内存分配情况的某个点，就会定位到 performance 中的某个任务的代码，点击可以在下面看到详情：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/44a3f73e7fe849b4bdb8299f8421c1c1~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

这样就定位到了分配内存的代码，分析一下哪里会有问题即可。

当然，前提还是要执行先 GC，再做一些操作，再 GC 的这个流程。

这是从代码角度来分析内存泄漏，其实还可以从内存中对象的角度，这个是通过 Memory 工具：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6fd6ad941bab4b5b8187a6c947aba15a~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

先 GC，录制一次内存快照，再点击几次按钮，然后 GC，再录制一次内存快照。

流程和用 performance 分析的时候一样。

拿到两次内存快照也是可以分析出有内存泄漏的：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4acaf66591f94fbdaebb472af431116c~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

可以看到 GC 后内存占用依然增长了。

快照记录着这个时刻内存中所有对象的状态：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eb2bdbfaa5ff4f9dae72bf6cf222b354~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

对比两次快照，就可以找到变化的部分：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5863e3656f214f79b128f556d212b8af~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

比如这时候可以看到最大的内存增长是 array 对象：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cf7ad5dbb2714b24835a25536f66edda~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

然后就可以从 array 的角度去思考是什么导致的内存泄漏了。

此外，memory 还有实时分析的工具：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/631adedd0b4a4c47b15f3a90803fdc16~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

选择第二个，然后点几次按钮：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c6edf03347e34b839884dbd5943fe176~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

其实不用手动 GC，JS 引擎会做 GC。

去掉 console.log 再录制是这样的：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f910450bcec142f8997f20fbfdb2aee6~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

除了最开始全局变量会分配一些内存以外，点击按钮之后的内存变蓝后又变灰了，也就是被 GC 了。

这样你点多少次按钮，内存占用都没有增长。

这就是代码执行完，会回收所有用到的内存的好代码。

而前面的那个是每次代码执行，都会占用一部分内存不释放的内存泄漏代码。

你还可以看到每一次内存分配的对象是啥：

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7d44aebcd20144228d73e3c4b1b5c47b~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

不管是用 Performance 工具还是 Memory 工具，都可以发现 console.log 有内存泄漏的问题。所以还是尽量不要用这个来调试了。

那应该用什么呢？

用 debugger 呀，不管是 vscode debugger 还是 chrome devtools 的都可以：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/01fadee1bc1e49d5938e9d32e8c632d7~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

你可以添加一个 logpoint 来代替 console.log 打印：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b1dd4864cdec43548076eb874715b3e6~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

代码执行到这里就会打印：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/50008e0930d54ccf8d45ef019fdecf8f~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

而你的代码里不需要写 console.log。

此外，很多地方可以用断点代替打印：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f2e060768a34125a26bd51e8b7c7047~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

可以看到代码执行路线和作用域，岂不是更高效？

总结
--

console.log 会导致内存泄漏，也就是代码执行完了，但还占据着一部分内存的流氓行为。

除了 console.log，游离的 dom 被变量引用、全局变量、变量被闭包引用、定时器没清除也会导致内存泄漏。

我们可以用 Performance 工具和 Memory 工具分析内存泄漏。

先手动 GC，然后执行一些操作，再 GC，如果内存没有回到执行前，就说明这段代码有内存泄漏，可以再用 Performance 定位到代码位置分析代码。

Memory 工具是从内存对象的角度分析，可以对两次快照做 diff，看下是啥对象泄漏了。

也可以实时检测内存占用情况，看看是否存在内存泄漏，对象是啥。

console.log 调试效率也不高，可以换成 logpoint，或者打断点。

千万不要把 console.log 上生产！不然这样有内存泄漏的代码，一旦执行时间长了就会有问题。

其实普通项目也还好，不会长期跑，但是类似大屏项目这种长期跑的，一旦有内存泄漏，一定会崩溃，只有时间长短的区别。

（这篇文章有点错误，在下篇更正了：[console.log 一定会导致内存泄漏？不打开 devtools 就不会](https://juejin.cn/post/7185501830040944698 "https://juejin.cn/post/7185501830040944698")）