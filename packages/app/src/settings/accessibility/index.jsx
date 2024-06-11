export default {
    id: "accessibility",
    icon: "MdAccessibilityNew",
    label: "Accessibility",
    group: "app",
    order: 4,
    settings: [
        {
            id: "haptics:enabled",
            storaged: true,
            group: "Accessibility",
            component: "Switch",
            icon: "MdVibration",
            title: "Haptic Feedback",
            description: "Enable haptic feedback on touch events.",
            desktop: false
        },
        {
            id: "longPressDelay",
            storaged: true,
            group: "Accessibility",
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
    ]
}