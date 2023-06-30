import config from "config"

export default {
    id: "general",
    icon: "Command",
    label: "General",
    group: "app",
    order: 0,
    settings: [
        {
            id: "language",
            storaged: true,
            group: "general",
            component: "Select",
            icon: "MdTranslate",
            title: "Language",
            description: "Choose a language for the application",
            props: {
                options: config.i18n.languages.map((language) => {
                    return {
                        label: language.name,
                        value: language.locale
                    }
                })
            },
            emitEvent: "changeLanguage"
        },
        {
            id: "haptic_feedback",
            storaged: true,
            group: "general",
            component: "Switch",
            icon: "MdVibration",
            title: "Haptic Feedback",
            description: "Enable haptic feedback on touch events.",
            desktop: false
        },
        {
            id: "longPressDelay",
            storaged: true,
            group: "general",
            component: "Slider",
            icon: "MdTimer",
            title: "Long press delay",
            description: "Set the delay before long press trigger is activated.",
            props: {
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
            id: "clear_internal_storage",
            storaged: false,
            group: "general",
            component: "Button",
            icon: "MdDelete",
            title: "Clear internal storage",
            description: "Clear all the data stored in the internal storage, including your current session. It will not affect the data stored in the cloud.",
            emitEvent: "app.clearInternalStorage",
            props: {
                danger: true,
                children: "Clear"
            },
        },
        {
            id: "low_performance_mode",
            storaged: true,
            group: "general",
            component: "Switch",
            icon: "MdSlowMotionVideo",
            title: "Low performance mode",
            description: "Enable low performance mode to reduce the memory usage and improve the performance in low-end devices. This will disable some animations and other decorative features.",
            emitEvent: "app.lowPerformanceMode",
            experimental: true,
            disabled: true,
        },
        {
            id: "ui.effects",
            storaged: true,
            group: "ui.sounds",
            component: "Switch",
            icon: "MdVolumeUp",
            title: "UI effects",
            description: "Enable the UI effects.",
            mobile: false,
        },
        {
            id: "ui.general_volume",
            storaged: true,
            group: "ui.sounds",
            component: "Slider",
            icon: "MdVolumeUp",
            title: "UI volume",
            description: "Set the volume of the app sounds.",
            props: {
                tipFormatter: (value) => {
                    return `${value}%`
                },
                min: 0,
                max: 100,
                step: 10,
            },
            emitEvent: "change:app.general_ui_volume",
            mobile: false,
        },
        {
            id: "notifications_sound",
            storaged: true,
            group: "notifications",
            component: "Switch",
            icon: "MdVolumeUp",
            title: "Notifications Sound",
            description: "Play a sound when a notification is received.",
        },
        {
            id: "notifications_vibrate",
            storaged: true,
            group: "notifications",
            component: "Switch",
            icon: "MdVibration",
            title: "Vibration",
            description: "Vibrate the device when a notification is received.",
            emitEvent: "changeNotificationsVibrate",
            desktop: false,
        },
        {
            id: "notifications_sound_volume",
            storaged: true,
            group: "notifications",
            component: "Slider",
            icon: "MdVolumeUp",
            title: "Sound Volume",
            description: "Set the volume of the sound when a notification is received.",
            props: {
                tipFormatter: (value) => {
                    return `${value}%`
                }
            },
            emitEvent: "changeNotificationsSoundVolume",
            mobile: false,
        },
        {
            id: "sidebar.collapsable",
            group: "sidebar",
            component: "Switch",
            icon: "Columns",
            title: "Auto Collapse",
            description: "Allow to collapse the sidebar when loose focus.",
            emitEvent: "settingChanged.sidebar_collapse",
            storaged: true,
            mobile: false,
        },
        {
            id: "sidebar.collapse_delay_time",
            group: "sidebar",
            component: "Slider",
            icon: "MdTimer",
            dependsOn: {
                "sidebar.collapsable": true
            },
            title: "Auto Collapse timeout",
            description: "Set the delay before the sidebar is collapsed",
            props: {
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
            },
            storaged: true,
            mobile: false,
        },
        {
            id: "feed_max_fetch",
            title: "Fetch max items",
            description: "Set the maximum number of items to load per fetch in the feed list",
            component: "Slider",
            icon: "MdFormatListNumbered",
            group: "posts",
            props: {
                min: 5,
                max: 50,
            },
            storaged: true,
        },
    ]
}