import config from "@config"

export default {
    id: "general",
    icon: "FiCommand",
    label: "General",
    group: "app",
    order: 0,
    settings: [
        {
            id: "app:language",
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
            emitEvent: "app:language_changes",
        },
        {
            id: "app:lpm",
            group: "general",
            component: "Switch",
            icon: "MdSlowMotionVideo",
            title: "Low performance mode",
            description: "Enable low performance mode disabling all the animations and secondary features, boosting the app performance.",
            emitEvent: "app:lpm_changed",
            props: {
                disabled: true
            },
            storaged: true,
            experimental: true,
            disabled: true,
        },
        {
            id: "clear_internal_storage",
            group: "general",
            component: "Button",
            icon: "MdDelete",
            title: "Clear internal storage",
            description: "Clear all the data stored in the internal storage, including your current session. It will not affect the data stored in the cloud.",
            props: {
                danger: true,
                children: "Clear",
                onClick: () => app.maintenance.clearInternalStorage()
            },
            noUpdate: true,
        },
        {
            id: "ui.effects",
            storaged: true,
            group: "ui.sounds",
            component: "Switch",
            icon: "MdVolumeUp",
            title: "Effects",
            description: "Enable the UI effects.",
            mobile: false,
        },
        {
            id: "ui.general_volume",
            storaged: true,
            group: "ui.sounds",
            component: "Slider",
            icon: "MdVolumeUp",
            title: "Volume",
            description: "Set the volume of the app UI sounds.",
            props: {
                tipFormatter: (value) => {
                    return `${value}%`
                },
                min: 0,
                max: 100,
                step: 10,
            },
            emitEvent: "sfx:test",
            mobile: false,
        },
        {
            id: "sfx:notifications_feedback",
            storaged: true,
            group: "notifications",
            component: "Switch",
            icon: "MdVolumeUp",
            title: "Notifications Sound",
            description: "Play a sound when a notification is received.",
        },
        {
            id: "haptics:notifications_vibrate",
            storaged: true,
            group: "notifications",
            component: "Switch",
            icon: "MdVibration",
            title: "Vibration",
            description: "Vibrate the device when a notification is received.",
            desktop: false,
        },
        {
            id: "sfx:notifications_volume",
            storaged: true,
            group: "notifications",
            component: "Slider",
            icon: "MdVolumeUp",
            title: "Volume",
            description: "Set the volume of the sound when a notification is received.",
            props: {
                tipFormatter: (value) => {
                    return `${value}%`
                }
            },
            mobile: false,
        },
        {
            id: "sidebar.collapse_delay_time",
            group: "sidebar",
            component: "Slider",
            icon: "MdTimer",
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
            id: "transcode:browser",
            group: "posts",
            component: "Switch",
            icon: "MdVideoCameraFront",
            title: "Transcode video in browser",
            description: "Transcode videos from the application instead of on the servers. This feature may speed up the posting process depending on your computer. This will consume your computer resources.",
            experimental: true,
            storaged: true
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