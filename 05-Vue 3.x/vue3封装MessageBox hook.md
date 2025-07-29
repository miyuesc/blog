# Vue3封装MessageBox Hook：从基础到高级的完整指南

> 🎭 想象一下，MessageBox就像是你的应用程序的"舞台旁白"，能够在关键时刻与用户进行交互。而useMessageBox Hook则像是这位旁白的"导演"，让你能够轻松控制何时、何地、以何种方式让这个旁白登场！今天我们就来打造这个强大的导演系统！

## 📝 开篇：为什么需要封装MessageBox？

Element Plus的MessageBox组件已经很强大了，但直接在组件中使用它会带来一些问题：
- 代码分散，难以统一管理和维护
- 类型提示不友好，需要手动声明
- 复杂场景下（如嵌套、动态更新）使用不便
- 与Composition API的结合不够自然

就像每次需要说话都要临时搭建一个舞台，而我们想要的是一个可以随时调用的"移动舞台"！

## 🔨 第一章：基础封装 - 打造简易舞台

### 1.1 最基础的封装

```javascript
// src/hooks/useMessageBox.js
import { ElMessageBox } from 'element-plus';

export function useMessageBox() {
  // 基础确认框
  const confirm = (message, title = '提示') => {
    return ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  };

  // 基础提示框
  const alert = (message, title = '提示') => {
    return ElMessageBox.alert(message, title, {
      confirmButtonText: '确定',
      type: 'info',
    });
  };

  // 基础输入框
  const prompt = (message, title = '请输入') => {
    return ElMessageBox.prompt(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[\w\-]+$/, // 默认简单校验
      inputErrorMessage: '只能输入字母、数字和下划线',
    });
  };

  return { confirm, alert, prompt };
}
```

### 1.2 在组件中使用

```vue
<!-- src/components/Example.vue -->
<template>
  <el-button @click="handleConfirm">显示确认框</el-button>
</template>

<script setup>
import { useMessageBox } from '@/hooks/useMessageBox';
const { confirm } = useMessageBox();

const handleConfirm = async () => {
  try {
    await confirm('确定要删除这条数据吗？');
    // 用户点击确定后的操作
    console.log('用户确认删除');
  } catch (error) {
    // 用户点击取消或关闭
    console.log('用户取消操作');
  }
};
</script>
```

这个基础版本解决了最基本的调用问题，但还不够灵活，就像一个只能表演固定节目的舞台！

## 🚀 第二章：完全支持 - 打造多功能舞台

### 2.1 支持所有属性的封装

```typescript
// src/hooks/useMessageBox.ts
import { ElMessageBox, ElMessageBoxOptions } from 'element-plus';
import { ComponentInternalInstance, getCurrentInstance } from 'vue';

type MessageBoxType = 'success' | 'warning' | 'info' | 'error';

type MessageBoxOptions = Omit<ElMessageBoxOptions, 'message' | 'title'> & {
  title?: string;
  type?: MessageBoxType;
};

type ConfirmOptions = MessageBoxOptions & {
  confirmButtonText?: string;
  cancelButtonText?: string;
};

type PromptOptions = ConfirmOptions & {
  inputType?: 'text' | 'textarea' | 'password' | 'number';
  inputPlaceholder?: string;
  inputPattern?: RegExp;
  inputValidator?: (value: string) => boolean | string;
  inputErrorMessage?: string;
};

export function useMessageBox() {
  const instance = getCurrentInstance();

  // 基础消息框
  const baseMessageBox = (
    message: string,
    title: string,
    options: ElMessageBoxOptions = {}
  ) => {
    // 默认配置
    const defaultOptions: ElMessageBoxOptions = {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
      // 自动聚焦取消按钮，防止误操作
      autofocus: 'cancel',
      // 继承当前组件的上下文
      appendTo: instance?.vnode.el as HTMLElement,
      ...options
    };

    return ElMessageBox(message, title, defaultOptions);
  };

  // 确认框
  const confirm = (
    message: string,
    title: string = '提示',
    options: ConfirmOptions = {}
  ) => {
    return baseMessageBox(message, title, {
      showCancelButton: true,
      ...options
    });
  };

  // 提示框
  const alert = (
    message: string,
    title: string = '提示',
    options: MessageBoxOptions = {}
  ) => {
    return baseMessageBox(message, title, {
      showCancelButton: false,
      ...options
    });
  };

  // 输入框
  const prompt = (
    message: string,
    title: string = '请输入',
    options: PromptOptions = {}
  ) => {
    return baseMessageBox(message, title, {
      showCancelButton: true,
      showInput: true,
      inputType: 'text',
      ...options
    });
  };

  return { confirm, alert, prompt };
}
```

### 2.2 类型完善与扩展

现在我们的hook支持了MessageBox的所有属性，并且有了完善的类型提示，就像给舞台配备了各种灯光和音响设备！

使用示例：

```typescript
// 高级确认框使用
const handleDelete = async () => {
  try {
    await confirm(
      '此操作将永久删除该文件，且无法恢复，确定要继续吗？',
      '警告',
      {
        type: 'error',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        center: true,
        draggable: true,
        // 自定义样式
        customClass: 'my-custom-message-box',
        // 点击遮罩层是否关闭
        closeOnClickModal: false
      }
    );
    // 执行删除操作
  } catch (error) {
    // 取消操作
  }
};
```

## 🧩 第三章：嵌套与层级 - 舞台调度系统

### 3.1 嵌套使用与层级管理

```typescript
// src/hooks/useMessageBox.ts
import { ElMessageBox, ElMessageBoxOptions } from 'element-plus';
import { ComponentInternalInstance, getCurrentInstance, ref } from 'vue';

// 消息框层级管理
const zIndex = ref(2000);

// 存储当前打开的消息框
const messageBoxStack: Array<{
  id: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

// 生成唯一ID
const generateId = () => {
  return 'msg-box-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
};

export function useMessageBox() {
  const instance = getCurrentInstance();
  // 增加层级
  const increaseZIndex = () => {
    zIndex.value += 1;
    return zIndex.value;
  };

  // 基础消息框
  const baseMessageBox = async (
    message: string,
    title: string,
    options: ElMessageBoxOptions = {}
  ) => {
    const msgBoxId = generateId();
    const currentZIndex = increaseZIndex();

    // 默认配置
    const defaultOptions: ElMessageBoxOptions = {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
      autofocus: 'cancel',
      appendTo: instance?.vnode.el as HTMLElement,
      zIndex: currentZIndex,
      ...options,
      // 关闭时的回调
      beforeClose: (action, instance, done) => {
        // 从栈中移除
        const index = messageBoxStack.findIndex(item => item.id === msgBoxId);
        if (index !== -1) {
          messageBoxStack.splice(index, 1);
        }
        done();
      }
    };

    return new Promise((resolve, reject) => {
      // 将当前消息框加入栈
      messageBoxStack.push({
        id: msgBoxId,
        resolve,
        reject
      });

      ElMessageBox(message, title, defaultOptions)
        .then(result => {
          resolve(result);
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  // ... 其他方法保持不变 ...

  // 关闭所有消息框
  const closeAll = () => {
    messageBoxStack.forEach(({ reject }) => {
      reject('closed');
    });
    messageBoxStack.length = 0;
  };

  return { confirm, alert, prompt, closeAll };
}
```

### 3.2 嵌套使用示例

```vue
<template>
  <el-button @click="openNestedMessageBox">打开嵌套消息框</el-button>
</template>

<script setup>
import { useMessageBox } from '@/hooks/useMessageBox';
const { confirm, alert } = useMessageBox();

const openNestedMessageBox = async () => {
  try {
    await confirm('这是第一层消息框，点击确定打开第二层', '嵌套示例');
    
    try {
      await confirm('这是第二层消息框', '嵌套示例');
      alert('操作成功', '提示', { type: 'success' });
    } catch (error) {
      alert('第二层操作已取消', '提示');
    }
  } catch (error) {
    // 用户取消第一层
  }
};
</script>
```

现在我们的消息框可以像俄罗斯套娃一样层层嵌套，并且层级关系清晰，就像一个专业的舞台调度系统！

## 🎮 第四章：主动控制 - 智能舞台管理

### 4.1 主动销毁与更新

```typescript
// src/hooks/useMessageBox.ts
import { ElMessageBox, ElMessageBoxOptions, MessageBoxCloseAction } from 'element-plus';
import { ComponentInternalInstance, getCurrentInstance, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// 消息框状态管理
interface MessageBoxState {
  id: string;
  instance: any; // MessageBox实例
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  options: ElMessageBoxOptions;
}

const messageBoxStore = ref<MessageBoxState[]>([]);
const zIndex = ref(2000);

export function useMessageBox() {
  const instance = getCurrentInstance();
  const increaseZIndex = () => {
    zIndex.value += 1;
    return zIndex.value;
  };

  const baseMessageBox = async (
    message: string,
    title: string,
    options: ElMessageBoxOptions = {}
  ) => {
    const msgBoxId = uuidv4();
    const currentZIndex = increaseZIndex();

    return new Promise((resolve, reject) => {
      // 创建消息框
      const msgBoxInstance = ElMessageBox(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
        autofocus: 'cancel',
        appendTo: instance?.vnode.el as HTMLElement,
        zIndex: currentZIndex,
        ...options,
        beforeClose: (action: MessageBoxCloseAction, instance: any, done: () => void) => {
          // 从store中移除
          const index = messageBoxStore.value.findIndex(item => item.id === msgBoxId);
          if (index !== -1) {
            messageBoxStore.value.splice(index, 1);
          }
          done();
        }
      });

      // 存储消息框状态
      messageBoxStore.value.push({
        id: msgBoxId,
        instance: msgBoxInstance,
        resolve,
        reject,
        options
      });

      msgBoxInstance.then(result => {
        resolve(result);
      }).catch(error => {
        reject(error);
      });
    });
  };

  // ... 其他方法保持不变 ...

  // 主动关闭指定消息框
  const closeMessageBox = (id: string, reason = 'closed') => {
    const msgBox = messageBoxStore.value.find(item => item.id === id);
    if (msgBox) {
      msgBox.reject(reason);
      // 关闭实例
      msgBox.instance.close();
      // 从store中移除
      messageBoxStore.value = messageBoxStore.value.filter(item => item.id !== id);
    }
  };

  // 更新消息框内容
  const updateMessageBox = (id: string, options: Partial<ElMessageBoxOptions>) => {
    const msgBox = messageBoxStore.value.find(item => item.id === id);
    if (msgBox) {
      // 更新选项
      msgBox.options = { ...msgBox.options, ...options };
      // 如果是消息或标题变更，需要重新创建消息框
      if (options.message || options.title) {
        // 关闭旧的
        msgBox.instance.close();
        // 创建新的
        const newInstance = ElMessageBox(
          options.message || msgBox.options.message || '',
          options.title || msgBox.options.title || '',
          msgBox.options
        );
        msgBox.instance = newInstance;
        // 重新绑定then/catch
        newInstance.then(result => msgBox.resolve(result)).catch(error => msgBox.reject(error));
      }
    }
  };

  // 获取当前打开的消息框
  const getOpenMessageBoxes = () => {
    return messageBoxStore.value.map(item => ({
      id: item.id,
      options: item.options
    }));
  };

  return { 
    confirm, alert, prompt, closeAll, 
    closeMessageBox, updateMessageBox, getOpenMessageBoxes 
  };
}
```

### 4.2 主动控制示例

```vue
<template>
  <div>
    <el-button @click="openControlledMessageBox">打开可控消息框</el-button>
    <el-button @click="updateMessageBox">更新消息框</el-button>
    <el-button @click="closeMessageBox">关闭消息框</el-button>
  </div>
</template>

<script setup>
import { useMessageBox } from '@/hooks/useMessageBox';
import { ref } from 'vue';

const { confirm, updateMessageBox, closeMessageBox } = useMessageBox();
const messageBoxId = ref('');

const openControlledMessageBox = async () => {
  const id = 'custom-id-' + Date.now();
  messageBoxId.value = id;
  
  try {
    const result = await confirm(
      '这是一个可以主动控制的消息框', 
      '可控示例',
      {
        // 传递自定义ID
        id
      }
    );
    console.log('用户确认', result);
  } catch (error) {
    console.log('消息框已关闭', error);
  }
};

const updateMessageBox = () => {
  if (messageBoxId.value) {
    updateMessageBox(messageBoxId.value, {
      message: '这是更新后的消息内容',
      title: '已更新',
      type: 'success'
    });
  }
};

const closeMessageBox = () => {
  if (messageBoxId.value) {
    closeMessageBox(messageBoxId.value, 'user closed');
  }
};
</script>
```

现在我们可以像操控无人机一样，随时控制消息框的开启、关闭和更新！

## 💡 第五章：高级特性与最佳实践

### 5.1 消息框队列

```typescript
// src/hooks/useMessageBox.ts
// ... 前面的代码保持不变 ...

// 消息队列
const messageQueue: Array<() => Promise<any>> = [];
const isProcessingQueue = ref(false);

// 处理队列
const processQueue = async () => {
  if (isProcessingQueue.value || messageQueue.length === 0) {
    return;
  }

  isProcessingQueue.value = true;
  const nextMessage = messageQueue.shift();

  if (nextMessage) {
    try {
      await nextMessage();
    } catch (error) {
      console.error('消息框队列处理失败', error);
    } finally {
      isProcessingQueue.value = false;
      processQueue();
    }
  }
};

// 添加到队列
const queueMessageBox = (messageBox: () => Promise<any>) => {
  messageQueue.push(messageBox);
  processQueue();
};

// 修改基础方法，支持队列
const baseMessageBox = async (
  message: string,
  title: string,
  options: ElMessageBoxOptions = {}
) => {
  // 添加队列支持
  const { queue = false } = options;
  
  if (queue) {
    return new Promise((resolve, reject) => {
      queueMessageBox(() => {
        return baseMessageBox(message, title, { ...options, queue: false })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  // ... 原有逻辑保持不变 ...
};

// ... 其他方法保持不变 ...

return { 
  confirm, alert, prompt, closeAll, 
  closeMessageBox, updateMessageBox, getOpenMessageBoxes, queueMessageBox
};
```

### 5.2 最佳实践

1. **统一管理**：在全局注册useMessageBox，避免重复导入

```javascript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { useMessageBox } from './hooks/useMessageBox';

const app = createApp(App);
// 全局注册
app.config.globalProperties.$messageBox = useMessageBox();
app.mount('#app');
```

2. **错误处理**：始终使用try/catch捕获取消操作

3. **性能优化**：
   - 避免频繁创建和销毁消息框
   - 复杂内容使用v-if控制显示
   - 大量消息使用队列模式

4. **可访问性**：
   - 设置适当的title和message
   - 使用type属性提供视觉反馈
   - 支持键盘操作

## 🎬 总结：打造你的MessageBox导演系统

通过本文的学习，我们从基础封装到高级特性，逐步打造了一个功能完善的useMessageBox Hook，就像从搭建简易舞台到创建专业剧场的过程！

我们实现了：
- ✅ 基础封装与调用
- ✅ 完整属性支持
- ✅ 嵌套使用与层级管理
- ✅ 主动销毁与更新
- ✅ 队列管理与高级特性

这个hook不仅让MessageBox的使用更加便捷，还解决了实际项目中的各种复杂场景，是Vue3项目中处理用户交互的得力助手！

最后，记住技术的魅力在于不断探索和优化，希望你能在此基础上创造出更强大的消息框系统！🎉

## 📚 扩展阅读
- [Element Plus MessageBox文档](https://element-plus.org/zh-CN/component/message-box.html)
- [Vue3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue3 生命周期](https://vuejs.org/guide/essentials/lifecycle.html)