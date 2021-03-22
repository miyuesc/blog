```json

{
    "name": "Properties",
    "superClass": [
        "Element"
    ],
    "meta": {
        "allowedIn": [ "*" ]
    },
    "properties": [
        {
            "name": "values",
            "type": "Property",
            "isMany": true
        }
    ]
},
{
    "name": "Property",
    "superClass": [
        "Element"
    ],
    "properties": [
        {
            "name": "id",
            "type": "String",
            "isAttr": true
        },
        {
            "name": "name",
            "type": "String",
            "isAttr": true
        },
        {
            "name": "value",
            "type": "String",
            "isAttr": true
        }
    ]
}
```



修改为：



```json
{
    "name": "FormProperty",
    "superClass": ["Element"],
    "meta": {
        "allowedIn": [ "*" ]
    },
    "properties": [
        {
            "name": "id",
            "type": "String",
            "isAttr": true
        },
        {
            "name": "name",
            "type": "String",
            "isAttr": true
        },
        {
            "name": "type",
            "type": "String",
            "isAttr": true
        },
        {
            "name": "expression",
            "type": "String",
            "isAttr": true
        },
        {
            "name": "variable",
            "type": "String",
            "isAttr": true
        }
    ]
}
```

