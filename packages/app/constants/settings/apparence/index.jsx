import React from "react"
import loadable from "@loadable/component"
import { Modal } from "antd"
import UploadButton from "../components/uploadButton"

import "./index.less"

export default {
    id: "apparence",
    icon: "Eye",
    label: "Apparence",
    group: "app",
    settings: [
        {
            id: "sidebar.floating",
            title: "Floating Sidebar",
            description: "Make the sidebar float over layout content.",
            component: "Switch",
            icon: "MdOutlineLastPage",
            group: "layout",
            emitEvent: "app.softReload",
            storaged: true,
        },
        {
            id: "style.reduceAnimations",
            group: "animations",
            component: "Switch",
            icon: "MdOutlineSlowMotionVideo",
            title: "Reduce animations",
            experimental: true,
            storaged: true,
        },
        {
            id: "style.pageTransitionDuration",
            group: "animations",
            component: "Slider",
            icon: "MdOutlineSpeed",
            title: "Page transition duration",
            description: "Change the duration of the page transition animation.",
            props: {
                min: 0,
                max: 1000,
                step: 50,
                marks: {
                    [app.cores.style.defaultVar("page-transition-duration").replace("ms", "")]: " ",
                },
                tooltip: {
                    formatter: (value) => `${value / 1000}s`
                }
            },
            defaultValue: () => {
                const value = app.cores.style.getValue("page-transition-duration")

                return value ? Number(value.replace("ms", "")) : 250
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    "page-transition-duration": `${value}ms`
                })
            },
            storaged: true,
        },
        {
            id: "style.auto_darkMode",
            group: "aspect",
            component: "Switch",
            icon: "Moon",
            title: "Sync with system",
            description: "Automatically switch to dark mode based on your system preference.",
            emitEvent: "style.autoDarkModeToogle",
            storaged: true,
        },
        {
            id: "style.darkMode",
            group: "aspect",
            component: "Switch",
            icon: "Moon",
            title: "Dark mode",
            description: "Change the theme variant of the application to dark.",
            dependsOn: {
                "style.auto_darkMode": false
            },
            defaultValue: () => {
                return app.cores.style.currentVariant === "dark"
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    themeVariant: value ? "dark" : "light"
                })

                return value
            },
            storaged: true
        },
        {
            id: "style.compactMode",
            group: "aspect",
            component: "Switch",
            icon: "MdOutlineViewCompact",
            title: "Compact mode",
            description: "Reduce the size of the application elements.",
            defaultValue: () => {
                return app.cores.style.getValue("compact-mode")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    "compact-mode": value
                })

                return value
            },
            storaged: true
        },
        {
            id: "style.uiFont",
            group: "aspect",
            component: "Select",
            icon: "MdOutlineFontDownload",
            title: "UI font",
            description: "Change the font of the application.",
            props: {
                style: {
                    width: "100%"
                },
                options: [
                    {
                        label: "Varela Round (Default)",
                        value: "'Varela Round', sans-serif"
                    },
                    {
                        label: "Inter",
                        value: "'Inter', sans-serif"
                    },
                ]
            },
            defaultValue: () => {
                return app.cores.style.getValue("fontFamily")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    "fontFamily": value
                })

                return value
            },
            storaged: true
        },
        {
            id: "style.colorPrimary",
            group: "aspect",
            component: "SliderColorPicker",
            title: "Primary color",
            description: "Change primary color of the application.",
            defaultValue: () => {
                return app.cores.style.getValue("colorPrimary")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    "colorPrimary": value
                })
            },
            storaged: false,
        },
        {
            id: "style.parallaxBackground",
            group: "aspect",
            component: "Switch",
            icon: "MdOutline3DRotation",
            title: "Parallax background",
            description: "Create a parallax effect on the background.",
            storaged: true,
        },
        {
            id: "style.backgroundImage",
            group: "aspect",
            icon: "MdOutlineImage",
            title: "Background image",
            description: "Change background image of the application. You can use a local image or a remote image (URL).",
            component: loadable(() => import("../components/urlInput")),
            props: {
                noPreview: true,
            },
            extraActions: [
                {
                    id: "delete",
                    icon: "Delete",
                    title: "Remove",
                    onClick: (ctx) => {
                        return ctx.dispatchUpdate("")
                    }
                },
                UploadButton
            ],
            defaultValue: () => {
                const value = app.cores.style.getValue("backgroundImage")

                console.log(value)

                return value ? value.replace(/url\(|\)/g, "") : ""
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundImage: `url(${value})`
                })
            },
            storaged: false,
        },
        {
            id: "style.backgroundPattern",
            group: "aspect",
            icon: "MdGrid4X4",
            component: loadable(() => import("../components/backgroundSelector")),
            title: "Background pattern",
            description: "Change background pattern of the application.",
            extraActions: [
                {
                    id: "remove",
                    icon: "Delete",
                    title: "Remove",
                    onClick: () => {
                        app.cores.style.modify({
                            backgroundSVG: "unset"
                        })
                    }
                }
            ],
            storaged: false,
        },
        {
            id: "style.backgroundBlur",
            group: "aspect",
            component: "Slider",
            icon: "MdBlurOn",
            title: "Background blur",
            description: "Create a blur effect on the background.",
            props: {
                min: 0,
                max: 50,
                step: 1
            },
            defaultValue: () => {
                const value = app.cores.style.getValue("backgroundBlur")

                return value ? parseInt(value.replace("px", "")) : 0
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundBlur: `${value}px`
                })
            },
            storaged: false,
        },
        {
            id: "style.backgroundColorTransparency",
            group: "aspect",
            component: "Slider",
            icon: "Eye",
            title: "Background color transparency",
            description: "Adjust the transparency of the background color.",
            props: {
                min: 0,
                max: 1,
                step: 0.1
            },
            defaultValue: () => {
                const value = app.cores.style.getValue("backgroundColorTransparency")

                return value ? parseFloat(value) : 1
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundColorTransparency: value
                })
            },
            storaged: false
        },
        {
            id: "style.backgroundSize",
            group: "aspect",
            component: "Select",
            icon: "MdOutlineImageAspectRatio",
            title: "Background size",
            description: "Adjust the size of the background image.",
            props: {
                style: {
                    width: "100%"
                },
                options: [
                    {
                        label: "Cover",
                        value: "cover"
                    },
                    {
                        label: "Contain",
                        value: "contain"
                    },
                    {
                        label: "Auto",
                        value: "auto"
                    },
                    {
                        label: "50%",
                        value: "50%"
                    },
                    {
                        label: "100%",
                        value: "100%"
                    },
                    {
                        label: "150%",
                        value: "150%"
                    },
                ]
            },
            defaultValue: () => {
                return app.cores.style.getValue("backgroundSize")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundSize: value
                })

                return value
            },
            storaged: false
        },
        {
            id: "style.backgroundPosition",
            group: "aspect",
            component: "Select",
            icon: "MdOutlineImageAspectRatio",
            title: "Background position",
            description: "Adjust the position of the background image.",
            props: {
                style: {
                    width: "100%"
                },
                options: [
                    {
                        label: "Left",
                        value: "left"
                    },
                    {
                        label: "Center",
                        value: "center"
                    },
                    {
                        label: "Right",
                        value: "right"
                    },
                    {
                        label: "Top",
                        value: "top"
                    },
                ]
            },
            defaultValue: () => {
                return app.cores.style.getValue("backgroundPosition")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundPosition: value
                })

                return value
            },
            storaged: false
        },
        {
            id: "style.backgroundRepeat",
            group: "aspect",
            component: "Select",
            icon: "MdOutlineImageAspectRatio",
            title: "Background repeat",
            description: "Adjust the repeat of the background image.",
            props: {
                style: {
                    width: "100%"
                },
                options: [
                    {
                        label: "Repeat",
                        value: "repeat"
                    },
                    {
                        label: "No repeat",
                        value: "no-repeat"
                    },
                    {
                        label: "Repeat X",
                        value: "repeat-x"
                    },
                    {
                        label: "Repeat Y",
                        value: "repeat-y"
                    },
                ]
            },
            defaultValue: () => {
                return app.cores.style.getValue("backgroundRepeat")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundRepeat: value
                })

                return value
            },
            storaged: false
        },
        {
            id: "style.backgroundAttachment",
            group: "aspect",
            component: "Select",
            icon: "MdOutlineImageAspectRatio",
            title: "Background attachment",
            description: "Adjust the attachment of the background image.",
            props: {
                style: {
                    width: "100%"
                },
                options: [
                    {
                        label: "Scroll",
                        value: "scroll"
                    },
                    {
                        label: "Fixed",
                        value: "fixed"
                    },
                    {
                        label: "Local",
                        value: "local"
                    },
                    {
                        label: "Initial",
                        value: "initial"
                    },
                    {
                        label: "Inherit",
                        value: "inherit"
                    },
                ]
            },
            defaultValue: () => {
                return app.cores.style.getValue("backgroundAttachment")
            },
            onUpdate: (value) => {
                app.cores.style.modify({
                    backgroundAttachment: value
                })

                return value
            },
            storaged: false
        },
        {
            id: "resetTheme",
            group: "aspect",
            component: "Button",
            title: "Reset theme",
            props: {
                children: "Default Theme"
            },
            onUpdate: (value) => {
                Modal.confirm({
                    title: "Are you sure you want to reset the theme to the default theme ?",
                    description: "This action will reset the theme to the default theme. All your modifications will be lost.",
                    onOk: () => {
                        app.cores.style.setDefault()
                    }
                })
            },
            storaged: false
        }
    ]
}