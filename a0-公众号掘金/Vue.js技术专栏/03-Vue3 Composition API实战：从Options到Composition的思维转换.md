# Vue3 Composition API实战：从Options到Composition的思维转换

> 🎯 各位Vue大佬们，今天咱们来聊聊那个让Vue3"脱胎换骨"的黑科技——Composition API！
>
> 想象一下，从Options API的"条条框框"到Composition API的"随心所欲"，这感觉就像从计划经济直接跳到了市场经济！今天我就带你们体验一下这种"思维革命"的快感！

## 🎪 开场白：从"计划经济"到"市场经济"

还记得被Options API支配的恐惧吗？我写了一个复杂的组件：

```vue
<!-- Options API时代的"大杂烩" -->
<template>
  <div class="user-dashboard">
    <h2>用户管理面板</h2>
    
    <div class="search-section">
      <input v-model="searchQuery" placeholder="搜索用户..." />
      <button @click="handleSearch" :disabled="isSearching">搜索</button>
    </div>

    <div class="user-list">
      <div 
        v-for="user in filteredUsers" 
        :key="user.id"
        class="user-item"
        @click="selectUser(user)"
      >
        <img :src="user.avatar" />
        <div>
          <h4>{{ user.name }}</h4>
          <p>{{ user.email }}</p>
          <span :class="user.status">{{ user.status }}</span>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage <= 1"
      >上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button 
        @click="nextPage" 
        :disabled="currentPage >= totalPages"
      >下一页</button>
    </div>

    <UserModal 
      :user="selectedUser" 
      :visible="showModal"
      @close="closeModal"
      @save="saveUser"
    />
  </div>
</template>

<script>
export default {
  name: 'UserDashboard',
  
  components: {
    UserModal
  },

  props: {
    initialQuery: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      users: [],
      searchQuery: this.initialQuery,
      selectedUser: null,
      showModal: false,
      currentPage: 1,
      pageSize: 10,
      totalUsers: 0,
      isSearching: false,
      searchTimeout: null
    }
  },

  computed: {
    filteredUsers() {
      return this.users.filter(user => 
        user.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    },
    
    totalPages() {
      return Math.ceil(this.totalUsers / this.pageSize)
    },

    searchParams() {
      return {
        query: this.searchQuery,
        page: this.currentPage,
        size: this.pageSize
      }
    }
  },

  watch: {
    searchQuery: {
      handler(newQuery) {
        clearTimeout(this.searchTimeout)
        this.searchTimeout = setTimeout(() => {
          this.currentPage = 1
          this.fetchUsers()
        }, 300)
      },
      immediate: true
    },

    currentPage() {
      this.fetchUsers()
    }
  },

  mounted() {
    this.fetchUsers()
    window.addEventListener('resize', this.handleResize)
  },

  beforeDestroy() {
    clearTimeout(this.searchTimeout)
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    async fetchUsers() {
      this.isSearching = true
      try {
        const response = await this.$api.getUsers(this.searchParams)
        this.users = response.data.users
        this.totalUsers = response.data.total
      } catch (error) {
        this.$message.error('获取用户失败')
      } finally {
        this.isSearching = false
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.fetchUsers()
    },

    selectUser(user) {
      this.selectedUser = { ...user }
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.selectedUser = null
    },

    async saveUser(user) {
      try {
        await this.$api.updateUser(user)
        this.$message.success('保存成功')
        this.closeModal()
        this.fetchUsers()
      } catch (error) {
        this.$message.error('保存失败')
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },

    handleResize() {
      // 响应式布局处理
    }
  }
}
</script>

<style scoped>
.user-dashboard {
  padding: 20px;
}
</style>
```

这个组件有200+行代码，逻辑散落在data、computed、watch、methods中，维护起来就像在一堆意大利面里找一根特定的面条！

## 🏗️ 第一站：Composition API的"思维革命"

### 从"分散"到"聚合"的思维转换

```typescript
// 使用Composition API重构后的优雅代码
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUsers } from '@/composables/useUsers'
import { useSearch } from '@/composables/useSearch'
import { usePagination } from '@/composables/usePagination'
import { useModal } from '@/composables/useModal'
import { useResponsive } from '@/composables/useResponsive'

// Props定义
const props = defineProps({
  initialQuery: {
    type: String,
    default: ''
  }
})

// 组合式逻辑聚合
const { users, totalUsers, fetchUsers, updateUser } = useUsers()
const { searchQuery, searchParams } = useSearch(props.initialQuery)
const { currentPage, pageSize, totalPages, prevPage, nextPage } = usePagination()
const { selectedItem: selectedUser, showModal, openModal, closeModal } = useModal()
const { isMobile } = useResponsive()

// 计算属性组合
const filteredUsers = computed(() => 
  users.value.filter(user => 
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

// 方法组合
const handleSaveUser = async (user) => {
  try {
    await updateUser(user)
    closeModal()
    await fetchUsers(searchParams.value)
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 生命周期组合
onMounted(() => {
  fetchUsers(searchParams.value)
})

// 监听组合
watch([searchQuery, currentPage], () => {
  fetchUsers(searchParams.value)
})
</script>
```

## ⚡ 第二站：核心Composables实战

### useUsers：用户数据管理

```typescript
// composables/useUsers.ts
import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useLoading } from './useLoading'
import { useErrorHandler } from './useErrorHandler'

export function useUsers() {
  const users = ref([])
  const totalUsers = ref(0)
  
  const api = useApi()
  const { isLoading, withLoading } = useLoading()
  const { handleError } = useErrorHandler()

  const fetchUsers = async (params = {}) => {
    return withLoading(async () => {
      try {
        const response = await api.get('/users', { params })
        users.value = response.data.users
        totalUsers.value = response.data.total
        return response.data
      } catch (error) {
        handleError(error, '获取用户列表失败')
        throw error
      }
    })
  }

  const createUser = async (userData) => {
    return withLoading(async () => {
      try {
        const response = await api.post('/users', userData)
        users.value.unshift(response.data)
        totalUsers.value++
        return response.data
      } catch (error) {
        handleError(error, '创建用户失败')
        throw error
      }
    })
  }

  const updateUser = async (userData) => {
    return withLoading(async () => {
      try {
        const response = await api.put(`/users/${userData.id}`, userData)
        const index = users.value.findIndex(u => u.id === userData.id)
        if (index !== -1) {
          users.value[index] = response.data
        }
        return response.data
      } catch (error) {
        handleError(error, '更新用户失败')
        throw error
      }
    })
  }

  const deleteUser = async (userId) => {
    return withLoading(async () => {
      try {
        await api.delete(`/users/${userId}`)
        users.value = users.value.filter(u => u.id !== userId)
        totalUsers.value--
      } catch (error) {
        handleError(error, '删除用户失败')
        throw error
      }
    })
  }

  const getUserById = computed(() => (id) => {
    return users.value.find(user => user.id === id)
  })

  const activeUsers = computed(() => 
    users.value.filter(user => user.status === 'active')
  )

  return {
    users: readonly(users),
    totalUsers: readonly(totalUsers),
    activeUsers,
    getUserById,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    isLoading
  }
}
```

### useSearch：搜索功能封装

```typescript
// composables/useSearch.ts
import { ref, computed, watch, nextTick } from 'vue'
import { useDebounce } from './useDebounce'

export function useSearch(initialQuery = '', options = {}) {
  const {
    debounceMs = 300,
    minLength = 0,
    maxLength = 100,
    caseSensitive = false
  } = options

  const searchQuery = ref(initialQuery)
  const searchResults = ref([])
  const isSearching = ref(false)
  const searchHistory = ref([])

  const { debouncedValue, isDebouncing } = useDebounce(searchQuery, debounceMs)

  const isValidQuery = computed(() => {
    const query = searchQuery.value.trim()
    return query.length >= minLength && query.length <= maxLength
  })

  const searchParams = computed(() => ({
    query: searchQuery.value.trim(),
    caseSensitive
  }))

  const addToHistory = (query) => {
    if (query.trim() && !searchHistory.value.includes(query)) {
      searchHistory.value.unshift(query)
      if (searchHistory.value.length > 10) {
        searchHistory.value.pop()
      }
    }
  }

  const clearHistory = () => {
    searchHistory.value = []
  }

  const search = async (searchFunction) => {
    if (!isValidQuery.value) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    try {
      const results = await searchFunction(searchParams.value)
      searchResults.value = results
      addToHistory(searchQuery.value)
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
  }

  return {
    searchQuery,
    searchResults,
    searchHistory,
    searchParams,
    isSearching,
    isDebouncing,
    isValidQuery,
    search,
    clearSearch,
    clearHistory
  }
}
```

### usePagination：分页逻辑

```typescript
// composables/usePagination.ts
import { ref, computed } from 'vue'

export function usePagination(options = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100]
  } = options

  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalItems = ref(0)

  const totalPages = computed(() => 
    Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  )

  const hasPrevious = computed(() => currentPage.value > 1)
  const hasNext = computed(() => currentPage.value < totalPages.value)

  const startItem = computed(() => 
    (currentPage.value - 1) * pageSize.value + 1
  )

  const endItem = computed(() => 
    Math.min(currentPage.value * pageSize.value, totalItems.value)
  )

  const pageNumbers = computed(() => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  })

  const setPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    if (hasNext.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (hasPrevious.value) {
      currentPage.value--
    }
  }

  const firstPage = () => {
    currentPage.value = 1
  }

  const lastPage = () => {
    currentPage.value = totalPages.value
  }

  const setPageSize = (size) => {
    pageSize.value = size
    currentPage.value = 1 // 重置到第一页
  }

  const reset = () => {
    currentPage.value = initialPage
    pageSize.value = initialPageSize
    totalItems.value = 0
  }

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasPrevious,
    hasNext,
    startItem,
    endItem,
    pageNumbers,
    pageSizeOptions,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    reset
  }
}
```

## 🎨 第三站：高级Composition模式

### 组合式逻辑复用

```typescript
// composables/useAsyncState.ts
import { ref, computed } from 'vue'

export function useAsyncState(asyncFunction, initialData = null) {
  const data = ref(initialData)
  const error = ref(null)
  const isLoading = ref(false)

  const isReady = computed(() => !isLoading.value && !error.value)
  const isError = computed(() => !!error.value)

  const execute = async (...args) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await asyncFunction(...args)
      data.value = result
      return result
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    data.value = initialData
    error.value = null
    isLoading.value = false
  }

  return {
    data: readonly(data),
    error: readonly(error),
    isLoading: readonly(isLoading),
    isReady,
    isError,
    execute,
    reset
  }
}

// 使用示例
const { data: users, isLoading, error, execute: fetchUsers } = useAsyncState(
  (params) => api.getUsers(params)
)

// 自动执行
onMounted(() => {
  fetchUsers({ page: 1 })
})
```

### 组合式状态管理

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const double = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  const isPositive = computed(() => count.value > 0)

  const increment = (step = 1) => {
    count.value += step
  }

  const decrement = (step = 1) => {
    count.value -= step
  }

  const reset = () => {
    count.value = initialValue
  }

  const setValue = (value) => {
    count.value = value
  }

  return {
    count: readonly(count),
    double,
    isEven,
    isPositive,
    increment,
    decrement,
    reset,
    setValue
  }
}

// 全局状态管理
import { reactive, readonly } from 'vue'

const state = reactive({
  user: null,
  theme: 'light',
  sidebarCollapsed: false
})

const mutations = {
  setUser(user) {
    state.user = user
  },
  
  setTheme(theme) {
    state.theme = theme
    localStorage.setItem('theme', theme)
  },
  
  toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed
  }
}

const actions = {
  async login(credentials) {
    try {
      const user = await api.login(credentials)
      mutations.setUser(user)
      return user
    } catch (error) {
      throw new Error('登录失败')
    }
  },
  
  async logout() {
    await api.logout()
    mutations.setUser(null)
  }
}

export function useGlobalStore() {
  return {
    state: readonly(state),
    ...mutations,
    ...actions
  }
}
```

### 组合式表单处理

```typescript
// composables/useForm.ts
import { ref, reactive, computed } from 'vue'

export function useForm(initialValues = {}, validationRules = {}) {
  const form = reactive({ ...initialValues })
  const errors = reactive({})
  const touched = reactive({})
  const isSubmitting = ref(false)

  const isValid = computed(() => {
    return Object.keys(errors).length === 0
  })

  const isDirty = computed(() => {
    return Object.keys(form).some(key => form[key] !== initialValues[key])
  })

  const validateField = (fieldName) => {
    const rules = validationRules[fieldName]
    if (!rules) return true

    const value = form[fieldName]
    errors[fieldName] = null

    if (rules.required && !value) {
      errors[fieldName] = rules.required.message || '此字段为必填项'
      return false
    }

    if (rules.minLength && value.length < rules.minLength.value) {
      errors[fieldName] = rules.minLength.message || `最少需要${rules.minLength.value}个字符`
      return false
    }

    if (rules.maxLength && value.length > rules.maxLength.value) {
      errors[fieldName] = rules.maxLength.message || `最多允许${rules.maxLength.value}个字符`
      return false
    }

    if (rules.pattern && !rules.pattern.value.test(value)) {
      errors[fieldName] = rules.pattern.message || '格式不正确'
      return false
    }

    return true
  }

  const validate = () => {
    let isValid = true
    Object.keys(validationRules).forEach(fieldName => {
      if (!validateField(fieldName)) {
        isValid = false
      }
    })
    return isValid
  }

  const handleBlur = (fieldName) => {
    touched[fieldName] = true
    validateField(fieldName)
  }

  const handleChange = (fieldName, value) => {
    form[fieldName] = value
    if (touched[fieldName]) {
      validateField(fieldName)
    }
  }

  const resetForm = () => {
    Object.assign(form, initialValues)
    Object.keys(errors).forEach(key => delete errors[key])
    Object.keys(touched).forEach(key => delete touched[key])
  }

  const submitForm = async (submitFunction) => {
    if (!validate()) {
      Object.keys(validationRules).forEach(validateField)
      return
    }

    isSubmitting.value = true
    try {
      const result = await submitFunction(form)
      return result
    } catch (error) {
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    validate,
    validateField,
    handleBlur,
    handleChange,
    resetForm,
    submitForm
  }
}

// 使用示例
const { 
  form, 
  errors, 
  touched, 
  isValid, 
  isSubmitting, 
  handleChange, 
  submitForm 
} = useForm(
  { username: '', email: '', password: '' },
  {
    username: {
      required: { message: '用户名不能为空' },
      minLength: { value: 3, message: '用户名至少3个字符' }
    },
    email: {
      required: { message: '邮箱不能为空' },
      pattern: { 
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '邮箱格式不正确'
      }
    },
    password: {
      required: { message: '密码不能为空' },
      minLength: { value: 6, message: '密码至少6个字符' }
    }
  }
)
```

## 🚀 第四站：实战项目案例

### 电商商品管理系统

```typescript
// composables/useProductManagement.ts
import { ref, computed, watch } from 'vue'
import { useAsyncState } from './useAsyncState'
import { useSearch } from './useSearch'
import { usePagination } from './usePagination'
import { useModal } from './useModal'
import { useForm } from './useForm'

export function useProductManagement() {
  // 基础状态
  const { data: products, execute: fetchProducts, isLoading } = useAsyncState(
    (params) => api.getProducts(params)
  )

  // 搜索功能
  const { searchQuery, searchResults, search } = useSearch('', {
    debounceMs: 500,
    minLength: 2
  })

  // 分页功能
  const pagination = usePagination({ initialPageSize: 20 })

  // 模态框管理
  const modal = useModal()

  // 分类筛选
  const selectedCategory = ref('all')
  const categories = ref([])

  // 排序
  const sortBy = ref('name')
  const sortOrder = ref('asc')

  // 价格区间
  const priceRange = ref({ min: 0, max: 10000 })

  // 组合筛选逻辑
  const filteredProducts = computed(() => {
    let result = products.value || []

    // 搜索过滤
    if (searchQuery.value) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    // 分类过滤
    if (selectedCategory.value !== 'all') {
      result = result.filter(product => product.category === selectedCategory.value)
    }

    // 价格过滤
    result = result.filter(product => 
      product.price >= priceRange.value.min && product.price <= priceRange.value.max
    )

    // 排序
    result = result.sort((a, b) => {
      const aVal = a[sortBy.value]
      const bVal = b[sortBy.value]
      const order = sortOrder.value === 'asc' ? 1 : -1
      return aVal > bVal ? order : -order
    })

    return result
  })

  // 分页计算
  const paginatedProducts = computed(() => {
    const start = (pagination.currentPage.value - 1) * pagination.pageSize.value
    const end = start + pagination.pageSize.value
    return filteredProducts.value.slice(start, end)
  })

  // 更新总数量
  watch(filteredProducts, (newProducts) => {
    pagination.totalItems.value = newProducts.length
  })

  // 商品表单
  const productForm = useForm(
    {
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      images: []
    },
    {
      name: {
        required: { message: '商品名称不能为空' },
        minLength: { value: 2, message: '商品名称至少2个字符' }
      },
      price: {
        required: { message: '价格不能为空' },
        min: { value: 0, message: '价格不能为负数' }
      },
      category: {
        required: { message: '请选择商品分类' }
      },
      stock: {
        required: { message: '库存不能为空' },
        min: { value: 0, message: '库存不能为负数' }
      }
    }
  )

  // 批量操作
  const selectedProducts = ref([])
  const isBatchMode = ref(false)

  const toggleBatchMode = () => {
    isBatchMode.value = !isBatchMode.value
    if (!isBatchMode.value) {
      selectedProducts.value = []
    }
  }

  const selectAll = () => {
    selectedProducts.value = filteredProducts.value.map(p => p.id)
  }

  const deselectAll = () => {
    selectedProducts.value = []
  }

  const deleteSelected = async () => {
    if (selectedProducts.value.length === 0) return

    try {
      await api.deleteProducts(selectedProducts.value)
      await fetchProducts()
      selectedProducts.value = []
      isBatchMode.value = false
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }

  // 库存预警
  const lowStockProducts = computed(() => 
    products.value.filter(product => product.stock <= 10)
  )

  // 统计信息
  const stats = computed(() => {
    const totalValue = products.value.reduce((sum, product) => 
      sum + (product.price * product.stock), 0
    )

    return {
      totalProducts: products.value.length,
      totalValue,
      lowStockCount: lowStockProducts.value.length,
      averagePrice: totalValue / products.value.length || 0
    }
  })

  // 初始化
  const initialize = async () => {
    await Promise.all([
      fetchProducts(),
      fetchCategories()
    ])
  }

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories()
      categories.value = response.data
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  return {
    // 数据
    products: filteredProducts,
    paginatedProducts,
    categories,
    stats,
    lowStockProducts,

    // 搜索
    searchQuery,
    searchResults,
    selectedCategory,
    sortBy,
    sortOrder,
    priceRange,

    // 分页
    ...pagination,

    // 模态框
    ...modal,

    // 表单
    productForm,

    // 批量操作
    selectedProducts,
    isBatchMode,
    toggleBatchMode,
    selectAll,
    deselectAll,
    deleteSelected,

    // 方法
    initialize,
    fetchProducts,
    fetchCategories
  }
}
```

## 🎯 第五站：性能优化与最佳实践

### 组合式性能优化

```typescript
// composables/usePerformanceOptimization.ts
import { ref, computed, nextTick, onActivated, onDeactivated } from 'vue'

export function useVirtualList(items, itemHeight, containerHeight) {
  const scrollTop = ref(0)
  const startIndex = computed(() => Math.floor(scrollTop.value / itemHeight))
  const endIndex = computed(() => 
    Math.min(startIndex.value + Math.ceil(containerHeight / itemHeight), items.value.length)
  )
  
  const visibleItems = computed(() => 
    items.value.slice(startIndex.value, endIndex.value)
  )

  const totalHeight = computed(() => items.value.length * itemHeight)

  const offsetY = computed(() => startIndex.value * itemHeight)

  return {
    visibleItems,
    totalHeight,
    offsetY,
    scrollTop
  }
}

// 防抖和节流
export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value)
  let timeout = null

  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}

export function useThrottle(value, delay = 100) {
  const throttledValue = ref(value.value)
  let lastUpdate = 0

  watch(value, (newValue) => {
    const now = Date.now()
    if (now - lastUpdate >= delay) {
      throttledValue.value = newValue
      lastUpdate = now
    }
  })

  return throttledValue
}

// 缓存策略
export function useMemo(factory, deps) {
  const cache = ref(null)
  const prevDeps = ref([])

  return computed(() => {
    const hasChanged = deps.value.some((dep, index) => 
      dep !== prevDeps.value[index]
    )

    if (hasChanged || cache.value === null) {
      cache.value = factory()
      prevDeps.value = [...deps.value]
    }

    return cache.value
  })
}
```

### 代码质量工具

```typescript
// composables/useValidation.ts
import { ref, computed } from 'vue'

export function useValidation() {
  const validators = {
    required: (message = '此字段为必填项') => (value) => 
      !!value || message,
    
    minLength: (min, message) => (value) => 
      value && value.length >= min || message || `最少需要${min}个字符`,
    
    maxLength: (max, message) => (value) => 
      value && value.length <= max || message || `最多允许${max}个字符`,
    
    email: (message = '请输入有效的邮箱地址') => (value) => 
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || message,
    
    url: (message = '请输入有效的URL') => (value) => 
      /^https?:\/\/.+/.test(value) || message,
    
    numeric: (message = '请输入数字') => (value) => 
      !isNaN(value) || message,
    
    min: (min, message) => (value) => 
      value >= min || message || `最小值为${min}`,
    
    max: (max, message) => (value) => 
      value <= max || message || `最大值为${max}`
  }

  return validators
}

// 测试工具
export function useTestHelpers() {
  const createMockUser = (overrides = {}) => ({
    id: 1,
    name: '测试用户',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides
  })

  const createMockProducts = (count = 10) => 
    Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `商品${index + 1}`,
      price: Math.floor(Math.random() * 1000) + 10,
      stock: Math.floor(Math.random() * 100),
      category: ['电子', '服装', '家居'][Math.floor(Math.random() * 3)]
    }))

  return {
    createMockUser,
    createMockProducts
  }
}
```

## 🎯 总结：Composition API的思维转换

### 从"声明式"到"组合式"的思维革命

1. **逻辑聚合**：相关逻辑放在一起，而不是分散在不同选项中
2. **代码复用**：通过composables实现真正的逻辑复用
3. **类型安全**：更好的TypeScript支持
4. **性能优化**：更细粒度的响应式控制

### 最佳实践清单

#### 设计原则
- [ ] 单一职责：每个composable只做一件事
- [ ] 可组合性：composables可以相互组合
- [ ] 可测试性：独立的逻辑单元
- [ ] 可复用性：跨组件共享逻辑

#### 命名规范
- [ ] 使用use前缀：useCounter, useApi
- [ ] 语义化命名：useUserSearch, useProductFilter
- [ ] 返回对象解构：{ count, increment }

#### 性能优化
- [ ] 合理使用computed和watch
- [ ] 避免不必要的响应式
- [ ] 使用shallowRef处理大对象
- [ ] 实现虚拟滚动

#### 错误处理
- [ ] 统一的错误处理机制
- [ ] 加载状态管理
- [ ] 重试机制
- [ ] 用户友好的错误提示

## 🚀 下期预告
Vue3专栏下一篇：《Vue3状态管理方案：从Vuex到Pinia的进化之路》

---

> **Composition API就像乐高积木，关键在于如何优雅地组合！** 🧩
> 
> 记住：**好的composable就像瑞士军刀，简单但功能强大！**

**思考题**：你能设计一个支持撤销/重做的composable吗？