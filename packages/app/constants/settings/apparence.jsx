import React from "react"

export default [
    {
        "id": "reduceAnimations",
        "storaged": true,
        "group": "aspect",
        "component": "Switch",
        "icon": "MdOutlineAnimation",
        "title": "Reduce animation",
        "experimental": true
    },
    {
        "id": "auto_darkMode",
        "experimental": true,
        "storaged": true,
        "group": "aspect",
        "component": "Switch",
        "icon": "Moon",
        "title": "Auto dark mode",
        "emitEvent": "app.autoDarkModeToogle",
    },
    {
        "experimental": true,
        "dependsOn": {
            "auto_darkMode": false
        },
        "id": "darkMode",
        "storaged": true,
        "group": "aspect",
        "component": "Switch",
        "icon": "Moon",
        "title": "Dark mode",
        "emitEvent": "theme.applyVariant",
        "emissionValueUpdate": (value) => {
            return value ? "dark" : "light"
        },
    },
    {
        "id": "primaryColor",
        "storaged": true,
        "group": "aspect",
        "component": "SliderColorPicker",
        "title": "Primary color",
        "description": "Change primary color of the application.",
        "emitEvent": "modifyTheme",
        "reloadValueOnUpdateEvent": "resetTheme",
        "emissionValueUpdate": (value) => {
            return {
                primaryColor: value
            }
        }
    },
    {
        "id": "resetTheme",
        "storaged": true,
        "group": "aspect",
        "component": "Button",
        "title": "Reset theme",
        "props": {
            "children": "Default Theme"
        },
        "emitEvent": "resetTheme",
        "noUpdate": true,
    }
]