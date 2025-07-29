# CSS动画与Web动画API的终极对决：从transition到requestAnimationFrame

> 🎨 各位前端艺术家们，今天咱们来聊聊那个让网页活起来的黑魔法——动画！
>
> 想象一下，你打开一个网站，按钮轻轻弹跳，卡片优雅翻转，加载动画丝滑流畅，用户"哇哦"一声就被征服了！今天我就带你们从CSS动画的温柔乡，一路杀到Web动画API的硬核战场！

## 🎭 开场白：当静态页面遇到动态灵魂

还记得第一次写CSS动画的时候吗？我写了个按钮hover效果：

```css
.button:hover {
  transform: scale(1.1);
  transition: transform 0.3s ease;
}
```

鼠标一放上去，按钮"嘭"地变大，我当时就惊了：这也太简单了吧！但是好景不长，产品经理说：

> "这个动画不够丝滑，要像德芙巧克力广告那样丝滑！"

于是我的动画噩梦开始了...

## 🚀 第一站：CSS Transition——动画界的"初恋"

CSS Transition就像是动画界的初恋，简单纯粹，但功能有限。

### 基础语法

```css
.element {
  transition: property duration timing-function delay;
  /* 简写 */
  transition: all 0.3s ease 0s;
  /* 分开写 */
  transition-property: transform;
  transition-duration: 0.3s;
  transition-timing-function: ease-in-out;
  transition-delay: 0.1s;
}
```

### 实际案例：卡片悬停效果

```css
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}
```

### 贝塞尔曲线的魔法

```css
/* 自定义贝塞尔曲线 */
.smooth-transition {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  /* 这个曲线会产生弹性效果 */
}

/* 常用预设值 */
.ease { transition-timing-function: ease; }
.ease-in { transition-timing-function: ease-in; }
.ease-out { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }
.linear { transition-timing-function: linear; }
```

### Transition的局限性

```css
/* ❌ 不能实现复杂动画序列 */
/* ❌ 不能中途暂停/恢复 */
/* ❌ 不能动态控制动画进度 */
/* ❌ 不能获取动画状态 */
```

## 🎯 第二站：CSS Animation——动画界的"进阶玩家"

当Transition不够用时，CSS Animation就像升级装备，可以玩出更多花样。

### 基础语法

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.element {
  animation: slideIn 0.5s ease-out forwards;
}
```

### 实际案例：加载动画

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 更复杂的加载动画 */
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}

.pulse-loader {
  animation: pulse 1.5s ease-in-out infinite;
}
```

### 动画控制属性

```css
.element {
  animation-name: myAnimation;
  animation-duration: 2s;
  animation-timing-function: ease-in-out;
  animation-delay: 0.5s;
  animation-iteration-count: infinite; /* 或具体数字 */
  animation-direction: alternate; /* normal | reverse | alternate | alternate-reverse */
  animation-fill-mode: forwards; /* none | forwards | backwards | both */
  animation-play-state: running; /* running | paused */
}

/* 简写 */
.element {
  animation: myAnimation 2s ease-in-out 0.5s infinite alternate forwards;
}
```

### 复杂动画序列

```css
@keyframes complexAnimation {
  0% {
    transform: scale(0.3) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) rotate(180deg);
    opacity: 1;
  }
  70% {
    transform: scale(0.9) rotate(270deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

.complex-element {
  animation: complexAnimation 2s ease-in-out;
}
```

## 🎪 第三站：Web动画API——动画界的"硬核玩家"

当CSS动画遇到瓶颈时，Web动画API就像开挂一样，给你完全的控制权！

### 基础语法

```javascript
const element = document.querySelector('.box')

// 基本动画
element.animate([
  { transform: 'translateX(0px)' },
  { transform: 'translateX(100px)' }
], {
  duration: 1000,
  easing: 'ease-in-out',
  fill: 'forwards'
})
```

### 实际案例：复杂动画序列

```javascript
function createComplexAnimation(element) {
  const keyframes = [
    { transform: 'scale(1) rotate(0deg)', opacity: 1 },
    { transform: 'scale(1.2) rotate(180deg)', opacity: 0.8 },
    { transform: 'scale(0.8) rotate(360deg)', opacity: 0.6 },
    { transform: 'scale(1) rotate(0deg)', opacity: 1 }
  ]
  
  const options = {
    duration: 2000,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    iterations: Infinity,
    direction: 'alternate'
  }
  
  return element.animate(keyframes, options)
}

// 使用
const box = document.querySelector('.animated-box')
const animation = createComplexAnimation(box)

// 控制动画
animation.pause()
animation.play()
animation.reverse()
animation.finish()
```

### 动画状态监听

```javascript
const animation = element.animate([
  { transform: 'translateX(0px)' },
  { transform: 'translateX(200px)' }
], { duration: 1000 })

animation.onfinish = () => {
  console.log('动画完成！')
  // 执行后续操作
}

animation.oncancel = () => {
  console.log('动画被取消！')
}

// 获取动画进度
animation.addEventListener('finish', () => {
  console.log('当前时间:', animation.currentTime)
})
```

### 多个动画同步

```javascript
function syncAnimations() {
  const elements = document.querySelectorAll('.sync-anim')
  
  const animations = Array.from(elements).map((el, index) => {
    return el.animate([
      { transform: 'translateY(0px)', opacity: 1 },
      { transform: 'translateY(-20px)', opacity: 0.7 },
      { transform: 'translateY(0px)', opacity: 1 }
    ], {
      duration: 1000,
      delay: index * 100, // 错开动画
      easing: 'ease-in-out',
      fill: 'forwards'
    })
  })
  
  // 等待所有动画完成
  Promise.all(animations.map(anim => anim.finished))
    .then(() => {
      console.log('所有动画完成！')
    })
}
```

## 🎯 第四站：requestAnimationFrame——动画界的"时间管理大师"

当需要完全控制动画时，`requestAnimationFrame`就是你的终极武器！

### 基础用法

```javascript
function animateWithRAF() {
  const element = document.querySelector('.raf-anim')
  let startTime = null
  const duration = 1000
  
  function step(timestamp) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    
    // 计算进度 (0 到 1)
    const progress = Math.min(elapsed / duration, 1)
    
    // 应用缓动函数
    const eased = easeInOutCubic(progress)
    
    // 更新元素位置
    element.style.transform = `translateX(${eased * 200}px)`
    
    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }
  
  requestAnimationFrame(step)
}

// 缓动函数
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}
```

### 实际案例：跟随鼠标动画

```javascript
class MouseFollower {
  constructor(element) {
    this.element = element
    this.x = 0
    this.y = 0
    this.targetX = 0
    this.targetY = 0
    this.easing = 0.1
    
    this.bindEvents()
    this.animate()
  }
  
  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.targetX = e.clientX
      this.targetY = e.clientY
    })
  }
  
  animate() {
    // 缓动跟随
    this.x += (this.targetX - this.x) * this.easing
    this.y += (this.targetY - this.y) * this.easing
    
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`
    
    requestAnimationFrame(() => this.animate())
  }
}

// 使用
const cursor = document.querySelector('.custom-cursor')
new MouseFollower(cursor)
```

### 性能对比

```javascript
// 测试不同动画方式的性能
function benchmarkAnimations() {
  const element = document.querySelector('.test-element')
  
  // CSS动画
  console.time('CSS Animation')
  element.classList.add('css-animation')
  setTimeout(() => {
    console.timeEnd('CSS Animation')
  }, 1000)
  
  // Web动画API
  console.time('Web Animations API')
  const animation = element.animate([
    { transform: 'translateX(0px)' },
    { transform: 'translateX(100px)' }
  ], { duration: 1000 })
  
  animation.onfinish = () => {
    console.timeEnd('Web Animations API')
  }
  
  // requestAnimationFrame
  console.time('requestAnimationFrame')
  let startTime = null
  const duration = 1000
  
  function rafAnimate(timestamp) {
    if (!startTime) startTime = timestamp
    const progress = Math.min((timestamp - startTime) / duration, 1)
    element.style.transform = `translateX(${progress * 100}px)`
    
    if (progress < 1) {
      requestAnimationFrame(rafAnimate)
    } else {
      console.timeEnd('requestAnimationFrame')
    }
  }
  
  requestAnimationFrame(rafAnimate)
}
```

## 🎪 第五站：GSAP动画库——动画界的"瑞士军刀"

当原生API不够用时，GSAP就像开挂一样！

### 基础用法

```javascript
// 引入GSAP
import { gsap } from 'gsap'

// 基本动画
gsap.to('.box', {
  duration: 2,
  x: 200,
  rotation: 360,
  ease: 'power2.inOut'
})

// 从当前状态到目标状态
gsap.from('.box', {
  duration: 1,
  opacity: 0,
  y: -50,
  stagger: 0.1
})

// 从某个状态到当前状态
gsap.fromTo('.box', 
  { opacity: 0, y: -50 },
  { opacity: 1, y: 0, duration: 1 }
)
```

### 时间线动画

```javascript
const tl = gsap.timeline()

tl.to('.box1', { duration: 1, x: 100 })
  .to('.box2', { duration: 0.5, y: 50 }, '-=0.5') // 提前0.5秒开始
  .to('.box3', { duration: 1, rotation: 360 }, '<') // 同时开始
  .addLabel('middle')
  .to('.box1', { duration: 0.5, scale: 1.5 }, 'middle')
  .to('.box2', { duration: 0.5, scale: 0.5 }, 'middle+=0.2')
```

### 滚动触发动画

```javascript
// ScrollTrigger插件
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

// 滚动触发动画
gsap.to('.animate-on-scroll', {
  y: 0,
  opacity: 1,
  duration: 1,
  scrollTrigger: {
    trigger: '.animate-on-scroll',
    start: 'top 80%', // 当元素顶部距离视口顶部80%时开始
    end: 'bottom 20%',
    scrub: 1, // 滚动时动画同步
    markers: true // 调试标记
  }
})

// 视差滚动
gsap.to('.parallax-bg', {
  yPercent: -50,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
})
```

### 复杂动画案例

```javascript
// 3D卡片翻转
function create3DCardFlip() {
  const cards = document.querySelectorAll('.flip-card')
  
  cards.forEach(card => {
    const front = card.querySelector('.flip-card-front')
    const back = card.querySelector('.flip-card-back')
    
    gsap.set([back], { rotationY: -180 })
    
    card.addEventListener('mouseenter', () => {
      gsap.to(front, { duration: 0.6, rotationY: 180 })
      gsap.to(back, { duration: 0.6, rotationY: 0 })
    })
    
    card.addEventListener('mouseleave', () => {
      gsap.to(front, { duration: 0.6, rotationY: 0 })
      gsap.to(back, { duration: 0.6, rotationY: -180 })
    })
  })
}

// 粒子动画
function createParticleAnimation() {
  const particles = []
  const particleCount = 50
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    document.body.appendChild(particle)
    
    const tl = gsap.timeline({ repeat: -1 })
    tl.set(particle, {
      x: 'random(-100, 100)',
      y: 'random(-100, 100)',
      scale: 'random(0.5, 1.5)',
      opacity: 1
    })
    .to(particle, {
      duration: 'random(2, 4)',
      x: 'random(-200, 200)',
      y: 'random(-200, 200)',
      scale: 0,
      opacity: 0,
      ease: 'power2.out'
    })
    
    particles.push(particle)
  }
}
```

## 🎯 第六站：性能优化与最佳实践

### 1. 硬件加速

```css
/* 启用GPU加速 */
.gpu-accelerated {
  transform: translateZ(0); /* 或 translate3d(0,0,0) */
  will-change: transform;
}

/* 避免布局抖动 */
.no-layout-thrash {
  position: absolute; /* 或 fixed */
  transform: translateX(100px); /* 代替 left: 100px */
}
```

### 2. 动画优化技巧

```javascript
// 批量DOM操作
function batchDOMUpdates(elements) {
  // 使用 requestAnimationFrame 批量处理
  requestAnimationFrame(() => {
    elements.forEach(el => {
      el.style.transform = 'translateX(100px)'
    })
  })
}

// 节流和防抖
function throttleAnimation(func, delay) {
  let timeoutId
  return function(...args) {
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        timeoutId = null
      }, delay)
    }
  }
}

// 使用 Intersection Observer 优化滚动动画
function optimizeScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate')
      }
    })
  })
  
  document.querySelectorAll('.scroll-animate').forEach(el => {
    observer.observe(el)
  })
}
```

### 3. 内存管理

```javascript
// 清理动画资源
class AnimationManager {
  constructor() {
    this.animations = new Set()
  }
  
  add(animation) {
    this.animations.add(animation)
  }
  
  destroy() {
    this.animations.forEach(animation => {
      if (animation.cancel) animation.cancel()
      if (animation.kill) animation.kill()
    })
    this.animations.clear()
  }
}

// 使用
const manager = new AnimationManager()
const anim = element.animate([...], {...})
manager.add(anim)

// 组件卸载时清理
useEffect(() => {
  return () => manager.destroy()
}, [])
```

## 🎪 第七站：实际项目案例

### 案例1：页面过渡动画

```javascript
// 路由切换动画
function usePageTransition() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
    
    return () => {
      setIsVisible(false)
    }
  }, [])
  
  return {
    pageStyle: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.3s ease-out'
    }
  }
}

// 使用
function Page() {
  const { pageStyle } = usePageTransition()
  
  return (
    <div style={pageStyle}>
      <h1>页面内容</h1>
    </div>
  )
}
```

### 案例2：拖拽排序动画

```javascript
function DraggableList({ items, onReorder }) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }
  
  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  
  const handleDrop = (dropIndex) => {
    if (draggedIndex === null) return
    
    const newItems = [...items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(dropIndex, 0, draggedItem)
    
    onReorder(newItems)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  return (
    <div className="draggable-list">
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          className={`draggable-item ${
            index === draggedIndex ? 'dragging' : ''
          } ${index === dragOverIndex ? 'drag-over' : ''}`}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
```

## 🎯 总结：动画选择指南

| 场景 | CSS Transition | CSS Animation | Web Animations API | requestAnimationFrame | GSAP |
|------|----------------|---------------|---------------------|----------------------|------|
| 简单悬停效果 | ✅ 最佳 | ⚠️ 过度 | ❌ 没必要 | ❌ 大炮打蚊子 | ❌ 杀鸡用牛刀 |
| 复杂序列动画 | ❌ 困难 | ✅ 适合 | ✅ 更好 | ✅ 完全控制 | ✅ 最简单 |
| 动态控制 | ❌ 不行 | ⚠️ 有限 | ✅ 完全支持 | ✅ 完全控制 | ✅ 完全支持 |
| 性能要求 | ✅ 很好 | ✅ 很好 | ✅ 很好 | ✅ 完全控制 | ✅ 优化到极致 |
| 学习成本 | ✅ 最低 | ✅ 低 | ⚠️ 中等 | ❌ 高 | ⚠️ 中等 |

## 🚀 下期预告

下一期咱们聊聊Canvas动画和WebGL，看看如何用代码画出整个宇宙！

---

> **如果你觉得这篇文章对你有帮助，别忘了点赞、收藏、转发三连！** 
> 
> 你们的支持就是我继续肝文的动力！🚀

**思考题**：你能用今天学的知识，实现一个60FPS的粒子爆炸效果吗？