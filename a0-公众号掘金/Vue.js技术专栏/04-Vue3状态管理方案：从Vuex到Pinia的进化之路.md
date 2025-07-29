# Vue3状态管理方案：从Vuex到Pinia的进化之路

> 🎯 各位Vue大佬们，今天咱们来聊聊Vue3状态管理的"进化史"！
>
> 从Vuex的"繁文缛节"到Pinia的"随心所欲"，这感觉就像从DOS系统直接升级到了macOS！今天我就带你们体验一下这种"脱胎换骨"的爽快感！

## 🎪 开场白：状态管理的"进化史"

还记得被Vuex支配的恐惧吗？我写了一个简单的购物车：

```javascript
// Vuex时代的"繁文缛节"
// store/modules/cart.js
const state = {
  items: [],
  checkoutStatus: null
}

const getters = {
  cartProducts: (state, getters, rootState) => {
    return state.items.map(({ id, quantity }) => {
      const product = rootState.products.all.find(product => product.id === id)
      return {
        title: product.title,
        price: product.price,
        quantity
      }
    })
  },

  cartTotalPrice: (state, getters) => {
    return getters.cartProducts.reduce((total, product) => {
      return total + product.price * product.quantity
    }, 0)
  }
}

const mutations = {
  pushProductToCart (state, { id }) {
    state.items.push({
      id,
      quantity: 1
    })
  },

  incrementItemQuantity (state, { id }) {
    const cartItem = state.items.find(item => item.id === id)
    cartItem.quantity++
  },

  setCartItems (state, { items }) {
    state.items = items
  },

  setCheckoutStatus (state, status) {
    state.checkoutStatus = status
  }
}

const actions = {
  addProductToCart ({ state, commit }, product) {
    commit('setCheckoutStatus', null)
    if (product.inventory > 0) {
      const cartItem = state.items.find(item => item.id === product.id)
      if (!cartItem) {
        commit('pushProductToCart', { id: product.id })
      } else {
        commit('incrementItemQuantity', { id: product.id })
      }
      commit('products/decrementProductInventory', { id: product.id }, { root: true })
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
```

现在看看Pinia的"简洁优雅"：

```typescript
// Pinia时代的"随心所欲"
// stores/cart.ts
import { defineStore } from 'pinia'
import { useProductsStore } from './products'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    checkoutStatus: null as string | null
  }),

  getters: {
    cartProducts: (state) => {
      const products = useProductsStore()
      return state.items.map(({ id, quantity }) => {
        const product = products.all.find(p => p.id === id)
        return {
          ...product,
          quantity
        }
      }).filter(p => p.id) // 过滤掉找不到的商品
    },

    cartTotalPrice: (state) => {
      return state.cartProducts.reduce((total, product) => {
        return total + product.price * product.quantity
      }, 0)
    },

    itemCount: (state) => {
      return state.items.reduce((count, item) => count + item.quantity, 0)
    }
  },

  actions: {
    addProduct(product: Product) {
      this.checkoutStatus = null
      const existingItem = this.items.find(item => item.id === product.id)
      
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.items.push({ id: product.id, quantity: 1 })
      }

      // 减少库存
      const products = useProductsStore()
      products.decrementInventory(product.id)
    },

    removeProduct(productId: number) {
      const index = this.items.findIndex(item => item.id === productId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    },

    updateQuantity(productId: number, quantity: number) {
      const item = this.items.find(item => item.id === productId)
      if (item) {
        if (quantity <= 0) {
          this.removeProduct(productId)
        } else {
          item.quantity = quantity
        }
      }
    },

    clearCart() {
      this.items = []
      this.checkoutStatus = null
    },

    async checkout() {
      if (this.items.length === 0) {
        this.checkoutStatus = '购物车为空'
        return false
      }

      try {
        await api.checkout(this.items)
        this.clearCart()
        this.checkoutStatus = '结账成功'
        return true
      } catch (error) {
        this.checkoutStatus = '结账失败'
        return false
      }
    }
  }
})
```

## 🏗️ 第一站：Pinia核心概念深度解析

### 1. Store的三种定义方式

```typescript
// 方式1：Options Store（最像Vuex）
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})

// 方式2：Setup Store（最像Composition API）
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, double, increment }
})

// 方式3：带持久化的Store
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('light')
  const language = ref('zh-CN')
  
  // 持久化配置
  const { state: persistedSettings } = useStorage('app-settings', {
    theme: 'light',
    language: 'zh-CN'
  })
  
  watch([theme, language], ([newTheme, newLang]) => {
    persistedSettings.value = { theme: newTheme, language: newLang }
  }, { deep: true })
  
  return { theme, language }
})
```

### 2. 响应式原理深度解析

```typescript
// Pinia的响应式魔法揭秘
import { effectScope, ref, computed } from 'vue'

// 手写一个简化版的Pinia Store
function createSimpleStore(id, setup) {
  let activeStore
  
  // 创建独立的effect scope
  const scope = effectScope(true)
  
  // 在scope中运行setup
  const store = scope.run(() => setup())
  
  // 包装store使其具有响应性
  return new Proxy(store, {
    get(target, prop) {
      // 自动追踪访问
      if (prop in target) {
        return target[prop]
      }
    },
    
    set(target, prop, value) {
      // 自动触发更新
      target[prop] = value
      return true
    }
  })
}

// 使用示例
const useUserStore = () => createSimpleStore('user', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  
  const login = async (credentials) => {
    user.value = await api.login(credentials)
  }
  
  const logout = () => {
    user.value = null
  }
  
  return { user, isLoggedIn, login, logout }
})
```

## 🎨 第二站：企业级状态管理架构

### 模块化Store设计

```typescript
// stores/index.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建Pinia实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 导出供main.ts使用
export default pinia

// stores/types/index.ts
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  preferences: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
  }
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
  images: string[]
  rating: number
  reviews: number
}

export interface CartItem {
  id: number
  quantity: number
  selected: boolean
}

// stores/user.ts
import { defineStore } from 'pinia'
import type { User } from '@/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userId: (state) => state.user?.id,
    isAdmin: (state) => state.user?.role === 'admin',
    
    welcomeMessage: (state) => {
      if (!state.user) return '欢迎回来'
      const hour = new Date().getHours()
      const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
      return `${greeting}，${state.user.name}`
    }
  },

  actions: {
    async login(email: string, password: string) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await api.post('/auth/login', { email, password })
        const { user, token } = response.data
        
        this.user = user
        this.token = token
        
        localStorage.setItem('token', token)
        api.setAuthToken(token)
        
        return { success: true, user }
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.user = null
        this.token = null
        localStorage.removeItem('token')
        api.setAuthToken(null)
      }
    },

    async updateProfile(profileData: Partial<User>) {
      this.isLoading = true
      try {
        const response = await api.put('/user/profile', profileData)
        this.user = { ...this.user, ...response.data }
        return { success: true, user: this.user }
      } catch (error) {
        this.error = error.response?.data?.message || '更新失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async refreshUser() {
      if (!this.token) return
      
      try {
        const response = await api.get('/user/me')
        this.user = response.data
      } catch (error) {
        if (error.response?.status === 401) {
          this.logout()
        }
      }
    }
  },

  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'user.preferences']
  }
})

// stores/products.ts
import { defineStore } from 'pinia'
import type { Product } from '@/types'

export const useProductsStore = defineStore('products', () => {
  // 状态
  const products = ref<Product[]>([])
  const categories = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 过滤和排序状态
  const filters = ref({
    category: 'all',
    priceRange: [0, 10000],
    searchQuery: '',
    inStock: false
  })
  
  const sortBy = ref('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  // 计算属性
  const filteredProducts = computed(() => {
    let result = products.value

    // 搜索过滤
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }

    // 分类过滤
    if (filters.value.category !== 'all') {
      result = result.filter(p => p.category === filters.value.category)
    }

    // 价格过滤
    result = result.filter(p => 
      p.price >= filters.value.priceRange[0] &&
      p.price <= filters.value.priceRange[1]
    )

    // 库存过滤
    if (filters.value.inStock) {
      result = result.filter(p => p.stock > 0)
    }

    return result
  })

  const sortedProducts = computed(() => {
    const sorted = [...filteredProducts.value]
    
    sorted.sort((a, b) => {
      const aVal = a[sortBy.value]
      const bVal = b[sortBy.value]
      
      if (typeof aVal === 'string') {
        return sortOrder.value === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    })
    
    return sorted
  })

  // 统计信息
  const stats = computed(() => ({
    total: products.value.length,
    totalValue: products.value.reduce((sum, p) => sum + p.price * p.stock, 0),
    lowStock: products.value.filter(p => p.stock <= 10).length,
    outOfStock: products.value.filter(p => p.stock === 0).length
  }))

  // 方法
  const fetchProducts = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories')
      ])
      
      products.value = productsResponse.data
      categories.value = categoriesResponse.data
    } catch (err) {
      error.value = err.response?.data?.message || '获取商品失败'
    } finally {
      isLoading.value = false
    }
  }

  const getProductById = (id: number) => 
    computed(() => products.value.find(p => p.id === id))

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    try {
      const response = await api.put(`/products/${id}`, updates)
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '更新失败')
    }
  }

  const createProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const response = await api.post('/products', product)
      products.value.unshift(response.data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '创建失败')
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      await api.delete(`/products/${id}`)
      products.value = products.value.filter(p => p.id !== id)
    } catch (error) {
      throw new Error(error.response?.data?.message || '删除失败')
    }
  }

  return {
    // 状态
    products: readonly(products),
    categories: readonly(categories),
    isLoading: readonly(isLoading),
    error: readonly(error),
    filters: readonly(filters),
    sortBy: readonly(sortBy),
    sortOrder: readonly(sortOrder),
    
    // 计算属性
    filteredProducts: sortedProducts,
    stats,
    
    // 方法
    fetchProducts,
    getProductById,
    updateProduct,
    createProduct,
    deleteProduct,
    
    // 设置器
    setFilters: (newFilters: Partial<typeof filters.value>) => {
      filters.value = { ...filters.value, ...newFilters }
    },
    setSort: (by: string, order: 'asc' | 'desc') => {
      sortBy.value = by
      sortOrder.value = order
    }
  }
})
```

## ⚡ 第三站：高级状态管理模式

### 1. 跨Store通信

```typescript
// stores/checkout.ts
import { defineStore } from 'pinia'
import { useCartStore } from './cart'
import { useUserStore } from './user'

export const useCheckoutStore = defineStore('checkout', () => {
  const cart = useCartStore()
  const user = useUserStore()
  
  const shippingInfo = ref({
    address: '',
    city: '',
    zipCode: '',
    country: ''
  })
  
  const paymentInfo = ref({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })
  
  const order = computed(() => ({
    userId: user.userId,
    items: cart.cartProducts,
    total: cart.cartTotalPrice,
    shipping: shippingInfo.value,
    payment: paymentInfo.value
  }))
  
  const isValid = computed(() => 
    cart.cartProducts.length > 0 &&
    user.isLoggedIn &&
    Object.values(shippingInfo.value).every(v => v.trim()) &&
    Object.values(paymentInfo.value).every(v => v.trim())
  )
  
  const placeOrder = async () => {
    if (!isValid.value) {
      throw new Error('订单信息不完整')
    }
    
    try {
      const response = await api.post('/orders', order.value)
      cart.clearCart()
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '下单失败')
    }
  }
  
  return {
    shippingInfo,
    paymentInfo,
    order,
    isValid,
    placeOrder
  }
})
```

### 2. 插件系统

```typescript
// plugins/pinia-logger.ts
import type { PiniaPluginContext } from 'pinia'

export function piniaLogger({ store }: PiniaPluginContext) {
  store.$subscribe((mutation, state) => {
    console.groupCollapsed(`🔄 ${store.$id} store mutation`)
    console.log('Type:', mutation.type)
    console.log('Store ID:', mutation.storeId)
    console.log('Payload:', mutation.payload)
    console.log('New State:', state)
    console.groupEnd()
  })
  
  store.$onAction((action) => {
    console.groupCollapsed(`⚡ ${store.$id} store action`)
    console.log('Action:', action.name)
    console.log('Args:', action.args)
    console.groupEnd()
    
    // 可以在这里添加性能监控
    const startTime = Date.now()
    action.after(() => {
      console.log(`${action.name} took ${Date.now() - startTime}ms`)
    })
  })
}

// 使用插件
import { createPinia } from 'pinia'
import { piniaLogger } from './plugins/pinia-logger'

const pinia = createPinia()
pinia.use(piniaLogger)
```

### 3. 状态持久化

```typescript
// plugins/pinia-persist.ts
import type { PiniaPluginContext } from 'pinia'

export function piniaPersist({ store }: PiniaPluginContext) {
  const storage = localStorage
  const key = `pinia-${store.$id}`
  
  // 从存储中恢复状态
  const storedState = storage.getItem(key)
  if (storedState) {
    try {
      store.$patch(JSON.parse(storedState))
    } catch (error) {
      console.error('Failed to restore state:', error)
    }
  }
  
  // 监听状态变化并保存
  store.$subscribe((mutation, state) => {
    try {
      storage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  })
}

// 高级持久化策略
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('light')
  const language = ref('zh-CN')
  const notifications = ref({
    email: true,
    push: false,
    sms: false
  })
  
  // 使用localStorage
  const { state: settings } = useStorage('app-settings', {
    theme: 'light',
    language: 'zh-CN',
    notifications: {
      email: true,
      push: false,
      sms: false
    }
  })
  
  // 同步到ref
  watch(settings, (newSettings) => {
    theme.value = newSettings.theme
    language.value = newSettings.language
    notifications.value = newSettings.notifications
  }, { deep: true, immediate: true })
  
  watch([theme, language, notifications], ([newTheme, newLang, newNotifs]) => {
    settings.value = {
      theme: newTheme,
      language: newLang,
      notifications: newNotifs
    }
  }, { deep: true })
  
  return {
    theme,
    language,
    notifications
  }
})
```

## 🎯 第四站：实战项目案例

### 电商平台的完整状态管理

```typescript
// stores/ecommerce/index.ts
export { useUserStore } from './user'
export { useProductsStore } from './products'
export { useCartStore } from './cart'
export { useCheckoutStore } from './checkout'
export { useOrdersStore } from './orders'

// stores/ecommerce/orders.ts
import { defineStore } from 'pinia'
import { useUserStore } from './user'

interface Order {
  id: number
  userId: number
  items: Array<{
    productId: number
    quantity: number
    price: number
  }>
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: {
    street: string
    city: string
    zipCode: string
    country: string
  }
  createdAt: string
  updatedAt: string
}

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const user = useUserStore()
  
  // 计算属性
  const userOrders = computed(() => 
    orders.value.filter(order => order.userId === user.userId)
  )
  
  const orderStats = computed(() => {
    const userOrders = orders.value.filter(order => order.userId === user.userId)
    return {
      total: userOrders.length,
      pending: userOrders.filter(o => o.status === 'pending').length,
      processing: userOrders.filter(o => o.status === 'processing').length,
      shipped: userOrders.filter(o => o.status === 'shipped').length,
      delivered: userOrders.filter(o => o.status === 'delivered').length,
      totalSpent: userOrders.reduce((sum, order) => sum + order.total, 0)
    }
  })
  
  // 方法
  const fetchOrders = async () => {
    if (!user.isLoggedIn) return
    
    isLoading.value = true
    try {
      const response = await api.get('/orders')
      orders.value = response.data
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchOrder = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.get(`/orders/${id}`)
      currentOrder.value = response.data
      return response.data
    } catch (error) {
      console.error('获取订单详情失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.post('/orders', orderData)
      orders.value.unshift(response.data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '创建订单失败')
    }
  }
  
  const updateOrderStatus = async (id: number, status: Order['status']) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status })
      const index = orders.value.findIndex(o => o.id === id)
      if (index !== -1) {
        orders.value[index] = response.data
      }
      if (currentOrder.value?.id === id) {
        currentOrder.value = response.data
      }
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '更新订单状态失败')
    }
  }
  
  const cancelOrder = async (id: number) => {
    return updateOrderStatus(id, 'cancelled')
  }
  
  return {
    orders: readonly(orders),
    currentOrder: readonly(currentOrder),
    userOrders,
    orderStats,
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder
  }
})
```

### 状态同步与实时更新

```typescript
// composables/useRealtimeSync.ts
import { useWebSocket } from '@vueuse/core'
import { useOrdersStore } from '@/stores/ecommerce'

export function useRealtimeSync() {
  const orders = useOrdersStore()
  
  const { status, data, send } = useWebSocket('ws://localhost:3000/realtime', {
    autoReconnect: true,
    heartbeat: {
      message: 'ping',
      interval: 10000,
      pongTimeout: 5000,
    },
  })
  
  watch(data, (message) => {
    if (!message) return
    
    try {
      const event = JSON.parse(message)
      
      switch (event.type) {
        case 'order:created':
          orders.orders.unshift(event.data)
          break
          
        case 'order:updated':
          const index = orders.orders.findIndex(o => o.id === event.data.id)
          if (index !== -1) {
            orders.orders[index] = event.data
          }
          break
          
        case 'order:deleted':
          orders.orders = orders.orders.filter(o => o.id !== event.data.id)
          break
      }
    } catch (error) {
      console.error('处理实时消息失败:', error)
    }
  })
  
  return {
    connectionStatus: status,
    sendMessage: send
  }
}
```

## 🚀 第五站：性能优化与最佳实践

### 1. 状态分割策略

```typescript
// 避免单一大Store，采用模块化设计
// ❌ 不好的做法
const useAppStore = defineStore('app', () => {
  const user = ref(null)
  const products = ref([])
  const cart = ref([])
  const orders = ref([])
  const settings = ref({})
  // ... 所有状态混在一起
})

// ✅ 好的做法
const useUserStore = defineStore('user', () => { /* ... */ })
const useProductsStore = defineStore('products', () => { /* ... */ })
const useCartStore = defineStore('cart', () => { /* ... */ })
```

### 2. 选择性持久化

```typescript
// 只持久化必要的状态
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const preferences = ref({ theme: 'light', language: 'zh-CN' })
  const tempData = ref({}) // 不持久化
  
  return { user, preferences, tempData }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['user.id', 'preferences'] // 只持久化指定路径
  }
})
```

### 3. 内存管理

```typescript
// 及时清理不需要的状态
export const useInfiniteScrollStore = defineStore('infinite-scroll', () => {
  const items = ref([])
  const page = ref(1)
  const hasMore = ref(true)
  
  const reset = () => {
    items.value = []
    page.value = 1
    hasMore.value = true
  }
  
  // 组件卸载时清理
  onScopeDispose(() => {
    reset()
  })
  
  return { items, page, hasMore, reset }
})
```

### 4. 错误处理策略

```typescript
// 统一的错误处理
export const useErrorHandlerStore = defineStore('error-handler', () => {
  const errors = ref<Array<{ id: string, message: string, type: 'error' | 'warning' }>>([])
  
  const addError = (message: string, type: 'error' | 'warning' = 'error') => {
    errors.value.push({
      id: Date.now().toString(),
      message,
      type
    })
    
    // 3秒后自动移除
    setTimeout(() => {
      removeError(errors.value[errors.value.length - 1].id)
    }, 3000)
  }
  
  const removeError = (id: string) => {
    const index = errors.value.findIndex(e => e.id === id)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }
  
  return {
    errors: readonly(errors),
    addError,
    removeError
  }
})
```

## 🎯 总结：Pinia进化之路

### Vuex vs Pinia 对比表

| 特性 | Vuex | Pinia |
|------|------|--------|
| **语法** | 繁琐的mutations/actions | 直接修改状态 |
| **TypeScript** | 需要额外类型定义 | 原生支持 |
| **模块化** | 需要namespaced | 天然模块化 |
| **组合式API** | 不友好 | 完美支持 |
| **包大小** | ~8kb | ~1kb |
| **开发体验** | 需要mapHelpers | 直接导入使用 |
| **状态持久化** | 需要插件 | 内置支持 |

### 最佳实践清单

#### 设计原则
- [ ] 单一职责：每个Store管理一个业务领域
- [ ] 可测试性：Store逻辑应该易于测试
- [ ] 可组合性：Store之间可以相互引用
- [ ] 性能优先：避免不必要的响应式

#### 命名规范
- [ ] Store ID使用kebab-case：`user-store`
- [ ] 方法使用动词：`fetchUser`, `updateProfile`
- [ ] 状态使用名词：`user`, `products`
- [ ] 计算属性使用形容词：`isLoggedIn`, `totalPrice`

#### 性能优化
- [ ] 使用computed缓存复杂计算
- [ ] 避免深层嵌套的对象
- [ ] 合理使用持久化
- [ ] 及时清理不需要的状态

#### 错误处理
- [ ] 统一的错误处理机制
- [ ] 用户友好的错误提示
- [ ] 网络错误重试机制
- [ ] 状态回滚机制

## 🚀 下期预告
Vue3专栏下一篇：《Vue3性能优化秘籍：从编译优化到运行时的极致追求》

---

> **Pinia就像状态管理的"瑞士军刀"，简洁但功能强大！** 🔧
> 
> 记住：**好的状态管理就像好的代码组织，清晰、可维护、易扩展！**

**思考题**：你能设计一个支持时间旅行的状态管理方案吗？