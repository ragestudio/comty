import React from "react"
import config from "config"
import { Select } from "antd"

export default [
    {
        "id": "language",
        "storaged": true,
        "group": "general",
        "component": "Select",
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
        "id": "haptic_feedback",
        "storaged": true,
        "group": "general",
        "component": "Switch",
        "icon": "MdVibration",
        "title": "Haptic Feedback",
        "description": "Enable haptic feedback on touch events.",
    },
    {
        "id": "selection_longPress_timeout",
        "storaged": true,
        "group": "general",
        "component": "Slider",
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
        "id": "clear_internal_storage",
        "storaged": false,
        "group": "general",
        "component": "Button",
        "icon": "MdDelete",
        "title": "Clear internal storage",
        "description": "Clear all the data stored in the internal storage, including your current session. It will not affect the data stored in the cloud.",
        "emitEvent": "app.clearInternalStorage"
    },
    {
        "id": "notifications_sound",
        "storaged": true,
        "group": "notifications",
        "component": "Switch",
        "icon": "MdVolumeUp",
        "title": "Notifications Sound",
        "description": "Play a sound when a notification is received.",
    },
    {
        "id": "notifications_vibrate",
        "storaged": true,
        "group": "notifications",
        "component": "Switch",
        "icon": "MdVibration",
        "title": "Vibration",
        "description": "Vibrate the device when a notification is received.",
        "emitEvent": "changeNotificationsVibrate"
    },
    {
        "id": "notifications_sound_volume",
        "storaged": true,
        "group": "notifications",
        "component": "Slider",
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
        "id": "collapseOnLooseFocus",
        "storaged": true,
        "group": "sidebar",
        "component": "Switch",
        "icon": "Columns",
        "title": "Auto Collapse",
        "description": "Collapse the sidebar when loose focus",
        "emitEvent": "settingChanged.sidebar_collapse",
    },
    {
        "id": "autoCollapseDelay",
        "storaged": true,
        "group": "sidebar",
        "component": "Slider",
        "icon": "MdTimer",
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
    {
        "id": "feed_max_fetch",
        "title": "Fetch max items",
        "description": "Set the maximum number of items to load per fetch in the feed list",
        "component": "Slider",
        "icon": "MdFormatListNumbered",
        "group": "posts",
        "props": {
            min: 5,
            max: 50,
        },
        "storaged": true,
    },
    {
        "id": "postCard_carrusel_auto",
        "title": "Auto show post media",
        "description": "Automatically show the post medias when the post has multiple medias",
        "component": "Switch",
        "icon": "MdPhotoCameraBack",
        "group": "posts",
        "storaged": true,
        "emitEvent": "router.forceUpdate",
        "disabled": true
    },
    {
        "id": "postCard_expansible_actions",
        "title": "Expansible actions",
        "description": "Automatically show or hide the actions bar",
        "component": "Switch",
        "icon": "MdCallToAction",
        "group": "posts",
        "storaged": true,
        "emitEvent": "router.forceUpdate"
    },
]