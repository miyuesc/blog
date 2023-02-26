# 通过一个例子解析 Vue 3 Watch 的工作原理



```typescript
// reactive的案例
const user: UnwrapNestedRefs<{ name: string }> = reactive({ name: '卖鱼强' })

watch(user, (value) => console.log('第-', value)) // 有效
watch(user.name, (value) => console.log('第二', value)) // 无效
watch(() => user,(value) => console.log('第三', value)) // 无效
watch(() => user.name,(value) => console.log('第四', value)) // 有效

// ref案例
const userRef: Ref<string> = ref('卖鱼强')

watch(userRef, (value) => console.log('第一个watch', value)) // 有效
watch(userRef.value, (value) => console.log('第二个watch', value)) // 无效
watch(() => userRef, (value) => console.log('第三次watch', value)) // 无效
watch(() => userRef.value, (value) => console.log('第四次watch', value)) // 有效
```



```typescript
// 侦听单个来源
function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): StopHandle

// 侦听多个来源
function watch<T>(
  sources: WatchSource<T>[],
  callback: WatchCallback<T[]>,
  options?: WatchOptions
): StopHandle

type WatchCallback<T> = (
  value: T,
  oldValue: T,
  onCleanup: (cleanupFn: () => void) => void
) => void

type WatchSource<T> =
  | Ref<T> // ref
  | (() => T) // getter
  | T extends object
  ? T
  : never // 响应式对象

interface WatchOptions extends WatchEffectOptions {
  immediate?: boolean // 默认：false
  deep?: boolean // 默认：false
  flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
}
```

