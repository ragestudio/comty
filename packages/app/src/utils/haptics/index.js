import { Haptics, ImpactStyle } from "@capacitor/haptics"

export default {
    selectionStart: async () => {
        const enabled = window.app.settings.get("haptic_feedback")

        if (enabled) {
            await Haptics.selectionStart()
        }
    },
    selectionChanged: async () => {
        const enabled = window.app.settings.get("haptic_feedback")

        if (enabled) {
            await Haptics.selectionChanged()
        }
    },
    selectionEnd: async () => {
        const enabled = window.app.settings.get("haptic_feedback")

        if (enabled) {
            await Haptics.selectionEnd()
        }
    },
    impact: async (style = "Medium") => {
        const enabled = window.app.settings.get("haptic_feedback")

        if (enabled) {
            style = String(style).toTitleCase()

            await Haptics.impact({ style: ImpactStyle[style] })
        }
    }
}