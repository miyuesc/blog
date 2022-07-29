---
theme: nico
highlight: a11y-dark
---

携手创作，共同成长！这是我参与「掘金日新计划 · 8 月更文挑战」的第2天，[点击查看活动详情](https://juejin.cn/post/7123120819437322247 "https://juejin.cn/post/7123120819437322247")

## 前言

继上次的 [Bpmn.js 进阶指南（万字长文）](https://juejin.cn/post/7117481147277246500) 之后，我相信大家对 Bpmn.js 的使用和自定义方法都有了一定的了解。但是因为有小伙伴反应文章太长，导致大家看完需要很长时间，正好配合 8月的更文活动，以后都在每篇文章中单独讲解一到三个小内容。

-----

🚀🚀现在开始第 12 小节，如何配置一个右键菜单

## 12. 扩展右键菜单

有的小伙伴这样的有需求：需要用户右键的时候有弹出框，用来取代原有上下文菜单 `ContentPad` ，以改变当前元素类型或者创建新的元素，这里为大家提供两种实现的方案。

### 12.1 完全自定义的右键菜单

#### 第一步：阻止默认事件

> 为了组织默认的浏览器右键事件，不管哪种方式都需要第一步：阻止默认事件。

```typescript
document.body.addEventListener('contextmenu', function (ev) {
    ev.preventDefault()
})
```

> 这里为什么不在 `modeler.on(eventName, callback(event))` 的回调函数中调用 `event.preventDefault()`，主要是因为原生的插件模块 `ElementTemplateChooser` 会生成一个遮罩层插入到 `body` 元素中，在回调内阻止默认事件无法全部阻止成功。当然这里可以按照实际情况具体确认该监听函数添加到哪个元素上。

#### 第二步：创建一个弹出框组件

这里使用的是 `Naive UI` 的 `Popover` 组件，采用手动定位的形式。

```vue
<template>
  <n-popover
    :show="showPopover"
    :x="x"
    :y="y"
    :show-arrow="false"
    trigger="manual"
    placement="right-start"
  >
    <div @click.stop>测试右键菜单</div>
  </n-popover>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue'
  import EventEmitter from '@/utils/EventEmitter'

  export default defineComponent({
    name: 'ContextMenu',
    setup() {
      const showPopover = ref(false)
      const x = ref(0)
      const y = ref(0)

      onMounted(() => {
        EventEmitter.on('show-contextmenu', (event: MouseEvent) => {
          x.value = event.clientX
          y.value = event.clientY
          showPopover.value = true
        })
        // 手动隐藏 (注意 模板中的 click.stop)
        document.body.addEventListener('click', () => (showPopover.value = false))
      })

      return {
        showPopover,
        x,
        y
      }
    }
  })
</script>
```

> 这里使用的是 `EventEmitter` 事件订阅来触发显示，也可以创建一个显示方法，在父组件调用。

#### 第三步：配置监听事件回调函数

```typescript
// EnhancementContextmenu.ts
export default function (modeler: Modeler) {
  modeler.on('element.contextmenu', 2000, (event) => {
    const { element, originalEvent } = event
    EventEmitter.emit('show-contextmenu', originalEvent)
  })
}
```

这里将函数抽离成了一个 `hook` 方法，因为笔者在这里有其他逻辑，如果大家只是需要该事件来触发显示的话，可以直接将这部分代码放置在 `new Modeler()` 之后。

这个 `element.contextmenu` 主要包含以下属性：

1. `element`: 当前右键的元素
2. `gfx`: 该元素对应的 svg 元素节点
3. `originalEvent`: 浏览器原生的右键事件实例
4. `type`: 事件类型，一般是监听的事件的类型字符串，但是打印出来经常是 `undefined`

#### 扩展：区分右键事件的触发对象来替换元素或者创建元素

第三步我们知道了 `element.contextmenu` 事件的回调函数参数有哪些值，那如何判断当前显示的弹出框内容呢？

根据原生的绘图逻辑和规则，在泳道和流程根节点中触发事件时，应该是创建新的流程元素节点的，而其他时候则应该是更改元素类型（这个看具体情况，有可能泳道、子流程也需要更改当前元素类型）。

1. 创建新元素：这里与 `Palette` 的 `dragstart` 事件类似，可以通过 `ElementFactory` 和 `Create` 来实现
2. 更改元素类型：可以使用 `BpmnReplace.replaceElement(element, target, hints?)` 来实现

当前，当触发的时候更改元素类型的时候，需要根据当前元素的类型进行判断，也可以根据业务需求改成其他类型的元素。

### 12.2 使用原生的 `PopupMenu`

这里根据第 11 小节，根据是否引用了 `ElementTemplateChooser` 模块也有两种情况。

```typescript
import Modeler from 'bpmn-js/lib/Modeler'
import PopupMenu from 'diagram-js/lib/features/popup-menu/PopupMenu'
import { Base } from 'diagram-js/lib/model'
import Canvas, { Position } from 'diagram-js/lib/core/Canvas'
import editor from '@/store/editor'
import ContextPad from 'diagram-js/lib/features/context-pad/ContextPad'
import EventEmitter from '@/utils/EventEmitter'
import { isAppendAction } from '@/utils/BpmnDesignerUtils'

export default function (modeler: Modeler) {
    const config = editor().getEditorConfig
    if (!config.contextmenu) return
    modeler.on('element.contextmenu', 2000, (event) => {
        const { element, originalEvent } = event
        // 原生面板扩展
        // 1. 更改元素类型
        if (!isAppendAction(element)) {
            return config.templateChooser
                ? openEnhancementPopupMenu(modeler, element, originalEvent)
                : openPopupMenu(modeler, element, originalEvent)
        }
        // 2. 创建新元素 (仅开始模板扩展时可以)
        if (!config.templateChooser) return
        const connectorsExtension: any = modeler.get('connectorsExtension')
        connectorsExtension &&
        connectorsExtension.createAnything(originalEvent, getContextMenuPosition(originalEvent))
    })
}

// default replace popupMenu
function openPopupMenu(modeler: Modeler, element: Base, event: MouseEvent) {
    const contextPad = modeler.get<ContextPad>('contextPad')
    const popupMenu = modeler.get<PopupMenu>('popupMenu')
    if (popupMenu && !popupMenu.isEmpty(element, 'bpmn-replace')) {
        popupMenu.open(element, 'bpmn-replace', {
            cursor: { x: event.clientX + 10, y: event.clientY + 10 }
        })
        // 设置画布点击清除事件
        const canvas = modeler.get<Canvas>('canvas')
        const container = canvas.getContainer()
        const closePopupMenu = (ev) => {
            if (popupMenu && popupMenu.isOpen() && ev.delegateTarget.tagName === 'svg') {
                popupMenu.close()
                container.removeEventListener('click', closePopupMenu)
            }
        }
        container.addEventListener('click', closePopupMenu)
    }
}

// templateChooser enhancement replace popupMenu
function openEnhancementPopupMenu(modeler: Modeler, element: Base, event: MouseEvent) {
    const replaceMenu: any = modeler.get('replaceMenu')
    if (replaceMenu) {
        replaceMenu.open(element, getContextMenuPosition(event, true))
    }
}

///// utils
function getContextMenuPosition(event: MouseEvent, offset?: boolean): Position {
    return {
        x: event.clientX + (offset ? 10 : 0),
        y: event.clientY + (offset ? 25 : 0)
    }
}
```

实现效果如下：

<image src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fe019787487c49cfb7223615807de33c~tplv-k3u1fbpfcp-watermark.image?" width="40%" alt="palette provider.png"></image>
<image src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ecef75e11b0741eca5d6b355e645411b~tplv-k3u1fbpfcp-watermark.image?" width="40%" alt="palette provider.png"></image>
<image src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0d662422a7fb4874ac4326ae27cb8c57~tplv-k3u1fbpfcp-watermark.image?" width="40%" alt="palette provider.png"></image>

> 这里的定位逻辑需要优化，篇幅有限暂时不做更新

**使用基于 `ElementTemplateChooser` 模块的方式来实现右键菜单需要注意一个问题：该模块产生的 DOM 节点是直接插入到 body 节点下的，如果需要使用该方式的话，记得在最外层添加以下 css 代码，用来重置鼠标事件。但是这样会导致正常的点击事件无法关闭 `ContextMenu` 面板，所以建议修改遮罩层样式，以提示用户关闭**

```scss
.cmd-change-menu {
  pointer-events: none !important;
  .cmd-change-menu__overlay {
    pointer-events: auto;
  }
}

.cmd-change-menu {
  background-color: rgba(0, 0, 0, .3);
}
```

## 后语

码字不易，希望大家多多支持，如果有遗漏或者疏忽也请大家及时指出，我好加以改正。

最近也在掘进看到了很多关于 bpmn.js 和 logicFlow 的如何选型或者两者的比较的文章，个人感觉两个库其实都是十分优秀的。logicFlow 在绘图方面，确实更加易于上手，api 和文档也更加友好。但是，如果针对配合后端流程引擎这一点来说的话，bpmn.js 的专业性就强了不少。

当然，bpmn.js 的上手难度确实要高不少，但是它本身的代码设计与功能拆分其实还是很友好的，只是需要静下心深入了解源码才行。

> 附上个人的小项目，基于 Vite + TypeScript+ Vue3 + NaiveUI + Bpmn.js 的流程编辑器（前端部分）[vite-vue-bpmn-process](https://github.com/moon-studio/vite-vue-bpmn-process)

-----
