## bpmn configurations

#### BpmnRenderer

```js
config = {
    defaultFillColor: 'Arial, sans-serif',
    defaultStrokeColor: 12,
    defaultLabelColor: 'normal'
}
```

#### TextRenderer

```js
config = {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.2
}
```

#### ContextPad

```js
config = {
    autoPlace: false,
    scale: { min: 1.0, max: 1.5 }
}
```

#### Canvas

```js
config = {
    deferUpdate: true,
    width: '100%',
    height: '100%'
}
```

#### AutoScroll

```js
config = {
    scrollThresholdIn: [ 20, 20, 20, 20 ],
    scrollThresholdOut: [ 0, 0, 0, 0 ],
    scrollRepeatTimeout: 15,
    scrollStep: 10
}
```

#### GridSnapping

```js
config = {
    active: true
}
```

#### KeyboardMoveSelection

```js
config = {
  moveSpeed: 1,
  moveSpeedAccelerated: 10
}
```

#### Keyboard

```js
config = {
    bindTo: document
}
```

#### Overlays

```js
// example:
// overlays: {
//    show: { minZoom: 0.7, maxZoom: 5.0 },
//    scale: { min: 1, max: 2 }
// }
config = {
    defaults: { show: null, scale: true }
}
```

#### PopupMenu

```js
// example:
// overlays: {
//    scale: { min: 1, max: 2 }
// }
config = {
    scale: {
        min: 1,
        max: 1.5
    }
}
```

#### ZoomScroll

```js
config = {
    enabled: true,
    scale: 0.75
}
```

#### Text

```js
config = {
    size: {
        width: 150,
        height: 50
    },
    padding: 0,
    style: {},
    align: 'center-top'
}
```
