import React from "react"
import loadable from "@loadable/component"

import "./index.less"

export default {
    icon: "Eye",
    label: "Apparence",
    settings: [
        {
            "id": "compactWidth",
            "title": "Compact Width",
            "description": "Sets the width of the app to a compact width to facilitate the vision of components.",
            "component": "Switch",
            "icon": "MdCompress",
            "group": "layout",
            "experimental": true,
            "storaged": true
        },
        {
            "id": "sidebar.floating",
            "title": "Floating Sidebar",
            "description": "Make the sidebar float over layout content.",
            "component": "Switch",
            "icon": "MdOutlineLastPage",
            "group": "layout",
            "emitEvent": "app.softReload",
            "storaged": true
        },
        {
            "id": "reduceAnimations",
            "storaged": true,
            "group": "animations",
            "component": "Switch",
            "icon": "MdOutlineSlowMotionVideo",
            "title": "Reduce animation",
            "experimental": true
        },
        {
            "id": "pageTransitionDuration",
            "storaged": true,
            "group": "animations",
            "component": "Slider",
            "icon": "MdOutlineSpeed",
            "title": "Page transition duration",
            "description": "Change the duration of the page transition animation.",
            "props": {
                min: 0,
                max: 1000,
                step: 50,
                tooltip: {
                    formatter: (value) => `${value / 1000}s`
                }
            },
            "emitEvent": "modifyTheme",
            "emissionValueUpdate": (value) => {
                return {
                    "page-transition-duration": `${value}ms`
                }
            },
        },
        {
            "id": "auto_darkMode",
            "experimental": true,
            "storaged": true,
            "group": "aspect",
            "component": "Switch",
            "icon": "Moon",
            "title": "Auto dark mode",
            "emitEvent": "style.autoDarkModeToogle",
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
            "id": "backgroundImage",
            "storaged": true,
            "group": "aspect",
            "title": "Background image",
            "description": "Change background image of the application. You can use a local image or a remote image (URL).",
            "component": loadable(() => import("../components/ImageUploader")),
            "props": {
                "noPreview": true,
            },
            "emitEvent": "modifyTheme",
            "emissionValueUpdate": (value) => {
                return {
                    backgroundImage: `url(${value})`
                }
            },
        },
        {
            "id": "backgroundBlur",
            "storaged": true,
            "group": "aspect",
            "component": "Slider",
            "icon": "Eye",
            "title": "Background blur",
            "description": "Create a blur effect on the background.",
            "props": {
                min: 0,
                max: 50,
                step: 5
            },
            "emitEvent": "modifyTheme",
            "emissionValueUpdate": (value) => {
                return {
                    backgroundBlur: `${value}px`,
                }
            },
        },
        {
            "id": "backgroundColorTransparency",
            "storaged": true,
            "group": "aspect",
            "component": "Slider",
            "icon": "Eye",
            "title": "Background color transparency",
            "description": "Adjust the transparency of the background color.",
            "props": {
                min: 0,
                max: 1,
                step: 0.1
            },
            "emitEvent": "modifyTheme",
            "emissionValueUpdate": (value) => {
                return {
                    backgroundColorTransparency: value,
                }
            },
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
}