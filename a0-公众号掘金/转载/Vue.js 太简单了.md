# Vue.js 太简单了

> 原文： [《Vue is Too Easy》](https://freedium.cfd/https://medium.com/@fadamakis/vue-is-too-easy-3d4ecca5e454)
>
> 作者：[Fotis Adamakis](https://medium.com/@fadamakis)

前端开发是一个非常两极化的行业。我们争论编程语言、框架，甚至最佳的缩进风格。但有一件事大家都同意：Vue 拥有最简单的学习曲线。

这是设计使然！Vue 的构建目标是在开发过程中不妨碍你。但不要被愚弄了，它极其强大、可扩展，并且能够支持任何架构。

让我们来研究一下使这一切成为可能的所有部分。

## 目录

- 组件声明
- 模板
- 样式
- Script Setup
- 响应式
- 状态管理
- 路由
- 异步组件
- 插槽
- 动画
- TypeScript 支持
- 单元测试

## 1. 组件声明

在 Vue 中，组件写在 .vue 文件中，称为单文件组件（SFCs）。

每个组件有三个不同的部分：

- `<template>` 定义组件的 UI 结构
- `<script setup>` 处理逻辑、状态和导入
- `<style scoped>` 包含特定于此组件的样式

```vue
<template>
  <!-- 模板：UI 结构 -->
  <h1>Hello, Vue World!</h1>
</template>

<script setup>
  // 脚本：变量和方法等逻辑
</script>

<style scoped>
  /* 样式：组件特定的 CSS */
</style>
```

所有三个部分都是可选的。如果需要，组件可以只是模板、只是逻辑，甚至只是样式。

现在，让我们更详细地探索每个部分。

## 2. 模板

模板部分定义组件 UI。它非常接近 HTML，但包含使其更强大的附加指令。

基本示例：

```vue
<template>
  <h1>{{ message }}</h1>
  <button @click="increment">Click me</button>
  <p>Count: {{ count }}</p>
</template>
```

- `{{ message }}` 在模板内显示响应式变量（插值）
- `@click="increment"` 将事件监听器绑定到按钮

### 条件渲染

只有当 `isVisible` 为 true 时，段落才会出现。

```vue
<p v-if="isVisible">这个文本是条件渲染的。</p>
```

### 渲染列表

循环遍历数组并动态渲染每个项目。

```vue
<ul>
  <li v-for="item in items" :key="item.id">{{ item.name }}</li>
</ul>
```

### 绑定属性

我们可以使用 `v-bind`（或其简写 `:`）动态分配属性值

```vue
<img :src="imageUrl" alt="Vue logo" />
```

模板系统是声明式和响应式的，当组件数据发生变化时，UI 会自动更新。

## 3. 样式

Vue 中的样式很简单。你可以在 `<style>` 部分内编写常规 CSS，就像在标准样式表中一样。Vue 使得作用域样式、使用预处理器和依赖打包器优化生产样式变得容易。

### 作用域样式

默认情况下，Vue 组件中的样式全局应用。但是，添加 `scoped` 属性将生成唯一的类名，以防止样式泄漏到其他组件。

```vue
<style scoped>
h1 {
  color: #42b983;
}
</style>
```

### 预处理器

Vue 开箱即用地支持 CSS 预处理器，如 SCSS、Less 和 Stylus。我们只需要在 `<style>` 标签内指定预处理器：

```vue
<style scoped lang="scss">
$primary-color: #42b983;

h1 {
  color: $primary-color;
  font-weight: bold;
}
</style>
```

这使得组织样式、重用变量和编写更清洁的 CSS 变得容易。

打包器（Vite 或 Webpack）将自动提取、压缩和优化样式，提高生产环境的加载时间和性能。

## 4. Script Setup

Vue 组件的最后一部分是 `<script setup>` 部分，我们在这里定义逻辑、状态和导入。

```vue
<template>
  <h1>{{ message }}</h1>
  <button @click="increment">Click me</button>
  <Counter :count="count" />
</template>

<script setup>
import Counter from "./Counter.vue";

const message = "Hello, Vue!";
const count = 0;

function increment() {
  // TODO
}
</script>
```

在 `<script setup>` 内声明的每个变量和函数都自动可用于模板。无需返回任何内容，Vue 会处理它。

上面的代码只有一个问题：变量不是响应式的！对 `count` 的更改不会触发 UI 更新。

## 5. 响应式

要声明响应式变量，我们需要使用内置的 `ref()` 和 `reactive()` 辅助函数。

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);

const increment = () => count.value++;
</script>
```

- `ref(0)` 创建一个响应式变量
- 需要 `.value` 来访问和修改其值

现在，每次 `count` 改变时，Vue 都会自动更新模板。

对于对象和数组，我们使用 `reactive()`。

```vue
<script setup>
import { reactive } from "vue";

const user = reactive({ name: "Alice", age: 25 });

user.age++;
</script>
```

注意，使用 `reactive` 时不需要 `.value`。

## 6. 状态管理

当多个组件需要共享数据时，我们需要更加注意状态管理模式。Vue 提供了不同的方式来处理状态，这取决于应用程序的复杂性。

### 状态提升

对于简单情况，状态可以在父级管理并通过 props 向下传递，而更新通过 emits 向上发送。

```vue
<!-- Parent.vue -->
<template>
  <Counter :count="count" @increment="increment" />
</template>

<script setup>
import { ref } from "vue";
import Counter from "./Counter.vue";

const count = ref(0);

function increment() {
  count.value++;
}
</script>
```

### Provide/Inject

对于更深的组件树，Vue 提供了 `provide` 和 `inject` API 来避免 prop drilling。

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from "vue";

const count = ref(0);
provide('count', count);
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from "vue";

const count = inject('count');
</script>
```

### Pinia（推荐的状态管理）

对于复杂的应用程序，Pinia 是 Vue 的官方状态管理库。

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  
  function increment() {
    count.value++
  }
  
  return { count, increment }
})
```

```vue
<!-- 在组件中使用 -->
<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>

<template>
  <p>{{ store.count }}</p>
  <button @click="store.increment">+</button>
</template>
```

## 7. 路由

Vue Router 是 Vue.js 的官方路由器，使构建单页应用程序变得容易。

### 基本设置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### 在组件中使用

```vue
<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <RouterView />
</template>
```

### 程序化导航

```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToAbout() {
  router.push('/about')
}
</script>
```

## 8. 异步组件

Vue 支持异步组件加载，这对代码分割和性能优化很有用。

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// 懒加载组件
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
</script>

<template>
  <Suspense>
    <AsyncComponent />
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

## 9. 插槽

插槽允许你创建可重用的组件，这些组件可以接受动态内容。

### 基本插槽

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<!-- 使用 -->
<template>
  <Card>
    <h2>Card Title</h2>
    <p>Card content goes here</p>
  </Card>
</template>
```

### 命名插槽

```vue
<!-- Layout.vue -->
<template>
  <div class="layout">
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<!-- 使用 -->
<template>
  <Layout>
    <template #header>
      <h1>Page Title</h1>
    </template>
    
    <p>Main content</p>
    
    <template #footer>
      <p>Footer content</p>
    </template>
  </Layout>
</template>
```

### 作用域插槽

```vue
<!-- List.vue -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item"></slot>
    </li>
  </ul>
</template>

<!-- 使用 -->
<template>
  <List :items="users">
    <template #default="{ item }">
      <strong>{{ item.name }}</strong> - {{ item.email }}
    </template>
  </List>
</template>
```

## 10. 动画

Vue 提供了强大的过渡和动画系统。

### 基本过渡

```vue
<template>
  <button @click="show = !show">Toggle</button>
  <Transition name="fade">
    <p v-if="show">Hello Vue!</p>
  </Transition>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

### 列表过渡

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
    </li>
  </TransitionGroup>
</template>

<style>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
```

## 11. TypeScript 支持

Vue 3 对 TypeScript 有出色的支持。

```vue
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
}

const users = ref<User[]>([])

const addUser = (user: User) => {
  users.value.push(user)
}

// Props 类型定义
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits 类型定义
interface Emits {
  update: [value: string]
  delete: [id: number]
}

const emit = defineEmits<Emits>()
</script>
```

## 12. 单元测试

Vue 有优秀的测试工具。

### 使用 Vitest 和 Vue Test Utils

```javascript
// Counter.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('increments count when button is clicked', async () => {
    const wrapper = mount(Counter)
    
    expect(wrapper.text()).toContain('Count: 0')
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.text()).toContain('Count: 1')
  })
  
  it('accepts initial count prop', () => {
    const wrapper = mount(Counter, {
      props: { initialCount: 5 }
    })
    
    expect(wrapper.text()).toContain('Count: 5')
  })
})
```

### 组合式 API 测试

```javascript
// useCounter.test.js
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { count, increment } = useCounter()
    
    expect(count.value).toBe(0)
    
    increment()
    
    expect(count.value).toBe(1)
  })
})
```

## 结论

Vue.js 的简单性不是偶然的——它是精心设计的结果。从直观的模板语法到强大的组合式 API，Vue 让开发者能够专注于构建出色的用户体验，而不是与框架作斗争。

无论你是在构建简单的交互式网站还是复杂的企业应用程序，Vue 都提供了合适的工具和模式来帮助你成功。它的渐进式特性意味着你可以根据需要采用其功能，使其成为各种规模项目的理想选择。

Vue 的生态系统继续发展，拥有出色的工具、库和社区支持。如果你还没有尝试过 Vue，现在是开始的绝佳时机！