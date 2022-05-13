import React from "react"
import config from "config"
import { Select } from "antd"

export default [
    {
        "id": "language",
        "storaged": true,
        "group": "general",
        "type": "Select",
        "icon": "MdTranslate",
        "title": "Language",
        "description": "Choose a language for the application",
        "props": {
            children: config.i18n.languages.map((language) => {
                return <Select.Option value={language.locale}>{language.name}</Select.Option>
            })
        },
        "emitEvent": "changeLanguage"
    },
    {
        "id": "forceMobileMode",
        "storaged": true,
        "group": "general",
        "type": "Switch",
        "icon": "MdSmartphone",
        "title": "Force Mobile Mode",
        "description": "Force the application to run in mobile mode.",
        "emitEvent": "forceMobileMode"
    },
    {
        "id": "haptic_feedback",
        "storaged": true,
        "group": "general",
        "type": "Switch",
        "icon": "MdVibration",
        "title": "Haptic Feedback",
        "description": "Enable haptic feedback on touch events.",
    },
    {
        "id": "selection_longPress_timeout",
        "storaged": true,
        "group": "general",
        "type": "Slider",
        "icon": "MdTimer",
        "title": "Selection press delay",
        "description": "Set the delay before the selection trigger is activated.",
        "props": {
            min: 300,
            max: 2000,
            step: 100,
            marks: {
                300: "0.3s",
                600: "0.6s",
                1000: "1s",
                1500: "1.5s",
                2000: "2s",
            }
        }
    },
    {
        "id": "notifications_sound",
        "storaged": true,
        "group": "notifications",
        "type": "Switch",
        "icon": "MdVolumeUp",
        "title": "Notifications Sound",
        "description": "Play a sound when a notification is received.",
    },
    {
        "id": "notifications_vibrate",
        "storaged": true,
        "group": "notifications",
        "type": "Switch",
        "icon": "MdVibration",
        "title": "Vibration",
        "description": "Vibrate the device when a notification is received.",
        "emitEvent": "changeNotificationsVibrate"
    },
    {
        "id": "notifications_sound_volume",
        "storaged": true,
        "group": "notifications",
        "type": "Slider",
        "icon": "MdVolumeUp",
        "title": "Sound Volume",
        "description": "Set the volume of the sound when a notification is received.",
        "props": {
            tipFormatter: (value) => {
                return `${value}%`
            }
        },
        "emitEvent": "changeNotificationsSoundVolume"
    },
    {
        "id": "edit_sidebar",
        "storaged": true,
        "group": "sidebar",
        "type": "Button",
        "icon": "Edit",
        "title": "Edit Sidebar",
        "emitEvent": "edit_sidebar",
        "noStorage": true
    },
    {
        "id": "collapseOnLooseFocus",
        "storaged": true,
        "group": "sidebar",
        "type": "Switch",
        "icon": "Columns",
        "title": "Auto Collapse",
        "description": "Collapse the sidebar when loose focus",
        "emitEvent": "settingChanged.sidebar_collapse",
    },
    {
        "id": "autoCollapseDelay",
        "storaged": true,
        "group": "sidebar",
        "type": "Slider",
        "icon": "Wh",
        "dependsOn": {
            "collapseOnLooseFocus": true
        },
        "title": "Auto Collapse timeout",
        "description": "Set the delay before the sidebar is collapsed",
        "props": {
            min: 0,
            max: 2000,
            step: 100,
            marks: {
                0: "No delay",
                600: "0.6s",
                1000: "1s",
                1500: "1.5s",
                2000: "2s",
            }
        }
    },
]