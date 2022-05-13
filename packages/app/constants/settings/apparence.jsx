import React from "react"

export default [
    {
        "id": "reduceAnimations",
        "storaged": true,
        "group": "aspect",
        "type": "Switch",
        "icon": "MdOutlineAnimation",
        "title": "Reduce animation",
        "experimental": true
    },
    {
        "experimental": true,
        "id": "darkMode",
        "storaged": true,
        "group": "aspect",
        "type": "Switch",
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
        "type": "SliderColorPicker",
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
        "type": "Button",
        "title": "Reset theme",
        "props": {
            "children": "Default Theme"
        },
        "emitEvent": "resetTheme",
        "noUpdate": true,
    }
]