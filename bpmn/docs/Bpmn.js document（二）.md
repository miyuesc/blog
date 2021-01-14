## 四. Modules

```javascript
modules: [
    {
        depends: [
            {
                bpmnRenderer: [
                    "type", 
                    BpmnRenderer(config, eventBus, styles, pathMap, canvas, textRenderer, priority)
                ], 
                pathMap: [
                    "type",
                    PathMap()
                ],
                textRenderer: [
                    "type",
                    TextRenderer()
                ]
            },
            {
                bpmnImporter: [
                    "type",
                    BpmnImporter(eventBus, canvas, elementFactory, elementRegistry, translate, textRenderer)
                ]
            }
        ]
    }
]
```



#### 9. AlignElements 元素对齐



#### 10. AttachSupport 依附支持



#### 11. AutoPlace 元素自动放置



#### 12. AutoResize 元素大小调整



#### 13. AutoScroll 画布滚动

 