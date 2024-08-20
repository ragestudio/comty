import { Modal } from "antd"
import loadable from "@loadable/component"
import UploadButton from "@components/UploadButton"

import "./index.less"

export default {
    id: "apparence",
    icon: "Eye",
    label: "Apparence",
    group: "app",
    order: 1,
    settings: [
        {
            id: "style:variant_mode",
            group: "aspect",
            icon: "Moon",
            title: "Theme",
            description: "Change the theme of the application.",
            component: loadable(() => import("../components/themeVariantSelector")),
            layout: "horizontal",
        },
        {
            id: "style.compactMode",
            group: "aspect",
            component: "Switch",
            icon: "MdOutlineViewCompact",
            title: "Compact mode",
            description: "Reduce the size of the application elements.",
            defaultValue: () => {
                return app.cores.style.getVar("compact-mode")
            },
            onUpdate: (value) => {
                app.cores.style.mutateTheme({
                    "compact-mode": value
                })

                return value
            },
            storaged: true
        },
        {
            id: "style.uiFontScale",
            group: "aspect",
            component: "Slider",
            icon: "MdFormatSize",
            title: "Font scale",
            description: "Change the font scale of the application.",
            props: {
                min: 1,
                max: 1.2,
                step: 0.01,
                tooltip: {
                    formatter: (value) => `x${value}`
                }
            },
            defaultValue: () => {
                return app.cores.style.getVar("fontScale")
            },
            onUpdate: (value) => {
                app.cores.style.mutateTheme({
                    "fontScale": value
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
            title: "Font family",
            description: "Change the font of the application.",
            props: {
                style: {
                    width: "100%"
                },
                options: [
                    {
                        label: "Inter (Default)",
                        value: "'Inter', sans-serif"
                    },
                    {
                        label: "Varela Round",
                        value: "'Varela Round', sans-serif"
                    },
                ]
            },
            defaultValue: () => {
                return app.cores.style.getVar("fontFamily")
            },
            onUpdate: (value) => {
                app.cores.style.mutateTheme({
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
            icon: "IoMdColorFill",
            defaultValue: () => {
                return app.cores.style.getVar("colorPrimary")
            },
            onUpdate: (value) => {
                app.cores.style.mutateTheme({
                    "colorPrimary": value
                })
            },
            storaged: false,
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
                const value = app.cores.style.getVar("backgroundImage")

                return value ? value.replace(/url\(|\)/g, "") : ""
            },
            onUpdate: (value) => {
                app.cores.style.mutateTheme({
                    backgroundImage: `url(${value})`
                })
            },
            storaged: false,
        },
        {
            id: "style.backgroundTweaker",
            group: "aspect",
            title: "Background tweaker",
            description: "Tweak the custom background",
            component: loadable(() => import("../components/backgroundTweaker")),
            storaged: false
        },
        {
            id: "resetTheme",
            group: "aspect",
            component: "Button",
            icon: "IoMdRefresh",
            title: "Reset to default theme",
            props: {
                children: "Reset"
            },
            onUpdate: (value) => {
                Modal.confirm({
                    title: "Are you sure you want to reset the theme to the default theme ?",
                    description: "This action will reset the theme to the default theme. All your modifications will be lost.",
                    onOk: () => {
                        app.cores.style.resetToDefault()
                    }
                })
            },
            storaged: false
        }
    ]
}