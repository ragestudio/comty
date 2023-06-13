import Core from "evite/src/core"

export default class HapticsCore extends Core {
    static refName = "haptics"
    static namespace = "haptics"
    static dependencies = [
        "settings"
    ]

    static get isGlobalDisabled() {
        return app.cores.settings.get("haptic_feedback")
    }

    public = {
        isGlobalDisabled: HapticsCore.isGlobalDisabled,
        vibration: this.vibration.bind(this),
    }

    vibration(...args) {
        const disabled = this.isGlobalDisabled

        if (disabled) {
            return false
        }

        return navigator.vibrate(...args)
    }
}