# 前端性能优化圣经：从FCP到TTI的极致追求

> 🚀 各位性能调优大师们，今天咱们来聊聊那个让老板血压飙升、让开发头发掉光的话题——前端性能优化！
>
> 想象一下，用户打开你的网页，结果白屏了3秒，这感觉就像相亲对象看到你的秃头一样，直接转身就走！今天我就带你们从FCP到TTI，把性能优化扒个底朝天！

## 🎭 开场白：从"秒开"到"秒关"的血泪史

还记得第一次做性能优化的时候吗？我接手了一个祖传代码库：

```javascript
// 天真的我以为这样就行
import _ from 'lodash'
import moment from 'moment'
import * as echarts from 'echarts'

// 然后直接一把梭哈
const App = () => {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>
          <img src={item.avatar} />
          <h1>{item.title}</h1>
          <p>{item.content}</p>
          <EchartsComponent data={item.chartData} />
        </div>
      ))}
    </div>
  )
}
```

结果Lighthouse一看：
- **FCP**: 3.2s 😱
- **LCP**: 4.8s 😵
- **TTI**: 8.5s 🤯

老板看了直接拍桌子："这TM是网页还是PPT？"

## 🚀 第一站：性能指标全家桶

### 核心指标详解

```typescript
// 性能监控工具类
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  
  constructor() {
    this.setupObserver()
  }
  
  // 核心指标收集
  collectCoreMetrics() {
    // FCP - First Contentful Paint
    this.observeFCP()
    
    // LCP - Largest Contentful Paint
    this.observeLCP()
    
    // FID - First Input Delay
    this.observeFID()
    
    // CLS - Cumulative Layout Shift
    this.observeCLS()
    
    // TTI - Time to Interactive
    this.observeTTI()
  }
  
  private observeFCP() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.set('FCP', entry.startTime)
          this.reportMetric('FCP', entry.startTime)
        }
      }
    }).observe({ entryTypes: ['paint'] })
  }
  
  private observeLCP() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.metrics.set('LCP', lastEntry.startTime)
      this.reportMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
  }
  
  private observeFID() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime
        this.metrics.set('FID', fid)
        this.reportMetric('FID', fid)
      }
    }).observe({ entryTypes: ['first-input'] })
  }
  
  private observeCLS() {
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      this.metrics.set('CLS', clsValue)
      this.reportMetric('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  private observeTTI() {
    // TTI计算比较复杂，需要多个指标
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const tti = navigation.domContentLoadedEventEnd - navigation.fetchStart
    this.metrics.set('TTI', tti)
    this.reportMetric('TTI', tti)
  }
  
  private reportMetric(name: string, value: number) {
    // 发送到监控系统
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ name, value, timestamp: Date.now() })
    })
  }
  
  // 获取性能评分
  getPerformanceScore(): number {
    const fcp = this.metrics.get('FCP') || 0
    const lcp = this.metrics.get('LCP') || 0
    const fid = this.metrics.get('FID') || 0
    const cls = this.metrics.get('CLS') || 0
    
    // 简化的评分算法
    const fcpScore = fcp < 1000 ? 100 : fcp < 3000 ? 75 : 50
    const lcpScore = lcp < 2500 ? 100 : lcp < 4000 ? 75 : 50
    const fidScore = fid < 100 ? 100 : fid < 300 ? 75 : 50
    const clsScore = cls < 0.1 ? 100 : cls < 0.25 ? 75 : 50
    
    return Math.round((fcpScore + lcpScore + fidScore + clsScore) / 4)
  }
}

// 使用示例
const monitor = new PerformanceMonitor()
monitor.collectCoreMetrics()
```

## 🚀 第二站：资源加载优化三板斧

### 1. 代码分割与懒加载

```typescript
// 路由级懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue')
  },
  {
    path: '/profile',
    component: () => import('./pages/Profile.vue')
  }
]

// 组件级懒加载
const LazyChart = defineAsyncComponent(() => 
  import('./components/Chart.vue')
)

// 图片懒加载指令
const vLazy = {
  mounted(el: HTMLImageElement, binding: DirectiveBinding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.src = binding.value
          observer.unobserve(el)
        }
      })
    })
    
    observer.observe(el)
  }
}

// 虚拟滚动优化
class VirtualScroller {
  private items: any[] = []
  private visibleRange = { start: 0, end: 20 }
  private itemHeight = 50
  
  constructor(private container: HTMLElement) {
    this.setupScroll()
  }
  
  private setupScroll() {
    this.container.addEventListener('scroll', () => {
      const scrollTop = this.container.scrollTop
      const start = Math.floor(scrollTop / this.itemHeight)
      const end = Math.ceil((scrollTop + this.container.clientHeight) / this.itemHeight)
      
      this.visibleRange = { start, end }
      this.renderVisibleItems()
    })
  }
  
  private renderVisibleItems() {
    const visibleItems = this.items.slice(this.visibleRange.start, this.visibleRange.end)
    // 只渲染可见区域
    this.container.innerHTML = ''
    visibleItems.forEach(item => {
      const div = document.createElement('div')
      div.style.height = `${this.itemHeight}px`
      div.textContent = item.text
      this.container.appendChild(div)
    })
  }
}
```

### 2. 资源预加载策略

```typescript
// 预加载关键资源
class ResourcePreloader {
  private preloadedResources: Set<string> = new Set()
  
  // 预加载图片
  preloadImages(urls: string[]) {
    urls.forEach(url => {
      if (!this.preloadedResources.has(url)) {
        const img = new Image()
        img.src = url
        img.onload = () => this.preloadedResources.add(url)
      }
    })
  }
  
  // 预加载字体
  preloadFonts(fontFaces: FontFace[]) {
    fontFaces.forEach(font => {
      document.fonts.add(font)
      font.load()
    })
  }
  
  // 基于用户行为的预加载
  preloadOnHover(element: HTMLElement, url: string) {
    element.addEventListener('mouseenter', () => {
      this.preloadResource(url)
    })
  }
  
  private preloadResource(url: string) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  }
}

// 使用示例
const preloader = new ResourcePreloader()
preloader.preloadImages(['/hero-image.jpg', '/logo.png'])
preloader.preloadOnHover(document.querySelector('.product-card'), '/product-detail')
```

### 3. Bundle优化

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  },
  
  plugins: [
    // 压缩优化
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }),
    
    // 图片压缩
    new ImageMinimizerPlugin({
      minimizerOptions: {
        plugins: [
          ['gifsicle', { interlaced: true }],
          ['jpegtran', { progressive: true }],
          ['optipng', { optimizationLevel: 5 }]
        ]
      }
    })
  ]
}
```

## 🚀 第三站：渲染优化四重奏

### 1. React优化技巧

```typescript
// 避免不必要的重渲染
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id
})

// useMemo缓存计算结果
const ExpensiveComponent = ({ items }) => {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])
  
  return <div>总价: {expensiveValue}</div>
}

// useCallback缓存函数
const Button = ({ onClick, children }) => {
  const handleClick = useCallback(() => {
    onClick()
  }, [onClick])
  
  return <button onClick={handleClick}>{children}</button>
}

// 虚拟列表优化大数据渲染
const VirtualList = ({ items, itemHeight, containerHeight }) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight),
    items.length
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(item => (
            <div key={item.id} style={{ height: itemHeight }}>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 2. Vue优化技巧

```typescript
// 使用v-show代替v-if
const OptimizedComponent = {
  template: `
    <div>
      <ExpensiveComponent v-show="showExpensive" />
      <button @click="toggle">切换</button>
    </div>
  `,
  data() {
    return { showExpensive: false }
  },
  methods: {
    toggle() {
      this.showExpensive = !this.showExpensive
    }
  }
}

// 使用keep-alive缓存组件
const CachedComponent = {
  template: `
    <keep-alive>
      <component :is="currentView" :key="currentView" />
    </keep-alive>
  `
}

// 计算属性缓存
const OptimizedComputed = {
  data() {
    return {
      items: [],
      filter: ''
    }
  },
  computed: {
    filteredItems() {
      // 只有当items或filter变化时才重新计算
      return this.items.filter(item => 
        item.name.includes(this.filter)
      )
    }
  }
}
```

### 3. CSS优化

```css
/* 使用transform代替top/left */
.optimized-animation {
  transform: translateX(100px);
  transition: transform 0.3s ease;
}

/* 使用will-change优化动画 */
.animated-element {
  will-change: transform;
}

/* 避免强制同步布局 */
.bad-practice {
  /* 触发重排 */
  width: element.offsetWidth + 'px';
}

.good-practice {
  /* 使用transform避免重排 */
  transform: scale(1.1);
}

/* 使用CSS Containment */
.container {
  contain: layout style paint;
}
```

## 🚀 第四站：网络优化秘籍

### 1. CDN与缓存策略

```typescript
// Service Worker缓存策略
const CACHE_NAME = 'app-v1'
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/offline.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中直接返回
        if (response) {
          return response
        }
        
        // 克隆请求
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then(response => {
          // 检查是否有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // 克隆响应
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
      })
  )
})

// 智能缓存策略
class SmartCache {
  private cache = new Map()
  private maxAge = 5 * 60 * 1000 // 5分钟
  
  set(key: string, value: any, maxAge?: number) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      maxAge: maxAge || this.maxAge
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  clear() {
    this.cache.clear()
  }
}
```

### 2. 请求优化

```typescript
// 请求合并
class RequestBatcher {
  private queue: Map<string, any[]> = new Map()
  private timer: NodeJS.Timeout | null = null
  
  addRequest(url: string, data: any) {
    if (!this.queue.has(url)) {
      this.queue.set(url, [])
    }
    this.queue.get(url)!.push(data)
    
    this.scheduleBatch()
  }
  
  private scheduleBatch() {
    if (this.timer) return
    
    this.timer = setTimeout(() => {
      this.flush()
      this.timer = null
    }, 100) // 100ms内合并请求
  }
  
  private async flush() {
    const promises = Array.from(this.queue.entries()).map(([url, data]) => {
      return fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    })
    
    this.queue.clear()
    return Promise.all(promises)
  }
}

// 请求防抖
function debounceRequest(fn: Function, delay: number) {
  let timer: NodeJS.Timeout
  
  return function(...args: any[]) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 使用示例
const debouncedSearch = debounceRequest(async (query: string) => {
  const response = await fetch(`/api/search?q=${query}`)
  return response.json()
}, 300)
```

### 3. 压缩优化

```javascript
// 图片压缩配置
const imageOptimization = {
  formats: ['webp', 'avif', 'jpeg'],
  responsive: [
    { width: 320, quality: 70 },
    { width: 640, quality: 80 },
    { width: 1024, quality: 90 }
  ],
  lazy: true,
  placeholder: 'blur'
}

// 使用sharp进行图片处理
const sharp = require('sharp')

async function optimizeImage(inputPath, outputPath, options) {
  const image = sharp(inputPath)
  
  const metadata = await image.metadata()
  
  // 生成多个尺寸
  const sizes = [320, 640, 1024, 1920]
  
  const promises = sizes.map(size => {
    return image
      .resize(size)
      .webp({ quality: options.quality })
      .toFile(`${outputPath}-${size}.webp`)
  })
  
  return Promise.all(promises)
}
```

## 🚀 第五站：内存优化实战

### 1. 内存泄漏检测

```typescript
// 内存监控工具
class MemoryMonitor {
  private measurements: number[] = []
  
  startMonitoring() {
    setInterval(() => {
      const memory = (performance as any).memory
      if (memory) {
        this.measurements.push(memory.usedJSHeapSize)
        
        if (this.measurements.length > 10) {
          this.measurements.shift()
        }
        
        this.checkMemoryLeak()
      }
    }, 5000)
  }
  
  private checkMemoryLeak() {
    if (this.measurements.length < 3) return
    
    const growth = this.measurements[this.measurements.length - 1] - this.measurements[0]
    const threshold = 10 * 1024 * 1024 // 10MB
    
    if (growth > threshold) {
      console.warn('检测到内存泄漏！')
      this.analyzeMemoryUsage()
    }
  }
  
  private analyzeMemoryUsage() {
    // 分析内存快照
    if (window.performance && (window.performance as any).memory) {
      const memory = (window.performance as any).memory
      console.table({
        'JS堆大小': `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'JS堆限制': `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        '总内存': `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }
}

// 使用Chrome DevTools进行内存分析
function createMemorySnapshot() {
  if (window.gc) {
    window.gc() // 强制垃圾回收
  }
  
  console.profile('Memory Profile')
  // 执行可能导致内存泄漏的操作
  console.profileEnd()
}
```

### 2. 事件监听器清理

```typescript
// 自动清理事件监听器
class EventManager {
  private listeners: Map<string, { element: Element, type: string, handler: Function }[]> = new Map()
  
  addListener(element: Element, type: string, handler: Function) {
    element.addEventListener(type, handler as EventListener)
    
    const key = `${element.toString()}_${type}`
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    this.listeners.get(key)!.push({ element, type, handler })
  }
  
  removeAllListeners(element?: Element) {
    if (element) {
      // 清理特定元素的所有监听器
      this.listeners.forEach((listeners, key) => {
        listeners.forEach(listener => {
          if (listener.element === element) {
            listener.element.removeEventListener(listener.type, listener.handler as EventListener)
          }
        })
      })
    } else {
      // 清理所有监听器
      this.listeners.forEach(listeners => {
        listeners.forEach(listener => {
          listener.element.removeEventListener(listener.type, listener.handler as EventListener)
        })
      })
      this.listeners.clear()
    }
  }
}

// 组件卸载时自动清理
function useAutoCleanup() {
  const eventManager = new EventManager()
  
  onUnmounted(() => {
    eventManager.removeAllListeners()
  })
  
  return eventManager
}
```

### 3. 对象池优化

```typescript
// 对象池模式
class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  
  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }
  
  release(obj: T) {
    this.resetFn(obj)
    this.pool.push(obj)
  }
  
  getSize(): number {
    return this.pool.length
  }
}

// 使用示例
const particlePool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 100 }),
  (particle) => {
    particle.x = 0
    particle.y = 0
    particle.vx = 0
    particle.vy = 0
    particle.life = 100
  }
)

// 粒子系统使用对象池
class ParticleSystem {
  private particles: any[] = []
  
  createParticle(x: number, y: number) {
    const particle = particlePool.acquire()
    particle.x = x
    particle.y = y
    this.particles.push(particle)
  }
  
  update() {
    this.particles = this.particles.filter(particle => {
      particle.life--
      if (particle.life <= 0) {
        particlePool.release(particle)
        return false
      }
      return true
    })
  }
}
```

## 🚀 第六站：实战案例分析

### 案例1：电商首页优化

```typescript
// 优化前：一次性加载所有商品
const BeforeOptimization = () => {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
  }, [])
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// 优化后：分页+虚拟滚动+懒加载
const AfterOptimization = () => {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const observerRef = useRef<IntersectionObserver>()
  
  useEffect(() => {
    loadProducts(page)
  }, [page])
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1)
      }
    })
    
    const lastElement = document.querySelector('.product:last-child')
    if (lastElement) {
      observerRef.current.observe(lastElement)
    }
    
    return () => observerRef.current?.disconnect()
  }, [products])
  
  return (
    <VirtualList
      items={products}
      itemHeight={200}
      containerHeight={600}
      renderItem={(product) => (
        <LazyProductCard product={product} />
      )}
    />
  )
}
```

### 案例2：图片画廊优化

```typescript
// 图片懒加载+预加载策略
const ImageGallery = () => {
  const [images, setImages] = useState([])
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    fetch('/api/images')
      .then(res => res.json())
      .then(setImages)
  }, [])
  
  // 预加载前3张图片
  useEffect(() => {
    images.slice(0, 3).forEach(image => {
      const img = new Image()
      img.src = image.thumbnail
      img.onload = () => setLoadedImages(prev => new Set(prev).add(image.id))
    })
  }, [images])
  
  return (
    <div className="gallery">
      {images.map(image => (
        <LazyImage
          key={image.id}
          src={image.src}
          placeholder={image.thumbnail}
          isLoaded={loadedImages.has(image.id)}
          onLoad={() => setLoadedImages(prev => new Set(prev).add(image.id))}
        />
      ))}
    </div>
  )
}

// 渐进式图片加载
const ProgressiveImage = ({ src, placeholder, alt }) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoading(false)
    }
  }, [src])
  
  return (
    <div className="image-container">
      <img 
        src={currentSrc} 
        alt={alt}
        className={`image ${isLoading ? 'loading' : 'loaded'}`}
      />
      {isLoading && <div className="placeholder" />}
    </div>
  )
}
```

## 🎯 性能优化最佳实践清单

### 开发阶段
- [ ] 使用Lighthouse定期检测
- [ ] 设置性能预算
- [ ] 使用Web Vitals监控
- [ ] 实现错误边界
- [ ] 添加性能测试

### 构建阶段
- [ ] 启用Tree Shaking
- [ ] 配置代码分割
- [ ] 压缩所有资源
- [ ] 生成source map
- [ ] 设置缓存策略

### 部署阶段
- [ ] 配置CDN
- [ ] 启用Gzip压缩
- [ ] 设置HTTP缓存头
- [ ] 使用Service Worker
- [ ] 监控性能指标

## 🎯 总结：性能优化的未来

性能优化的核心：**用户体验第一**！

未来趋势：
- **AI优化**：智能分析性能瓶颈
- **边缘计算**：CDN边缘渲染
- **WebAssembly**：极致性能体验
- **HTTP/3**：更快的网络传输

## 🚀 下期预告

下一期咱们聊聊工程化与工具链，看看如何打造高效开发流水线！

---

> **性能优化就像减肥，没有捷径，只有坚持！** 💪
> 
> 记住：**快就是生产力，慢就是原罪！**

**思考题**：你能设计一个自动化的性能监控系统吗？