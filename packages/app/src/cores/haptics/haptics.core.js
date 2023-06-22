import Core from "evite/src/core"
import { Haptics } from "@capacitor/haptics"

const vibrationPatterns = {
    light: [10],
    medium: [50],
    heavy: [80],
    error: [100, 30, 100, 30, 100],
}

export default class HapticsCore extends Core {
    static refName = "haptics"
    static namespace = "haptics"
    static dependencies = [
        "settings"
    ]

    static isGlobalDisabled() {
        return app.cores.settings.is("haptic_feedback", false)
    }

    async onInitialize() {
        if (window.navigator.userAgent === "capacitor") {
            navigator.vibrate = this.nativeVibrate
        }

        document.addEventListener("click", this.handleClickEvent)
    }

    public = {
        isGlobalDisabled: HapticsCore.isGlobalDisabled,
        vibrate: this.vibrate.bind(this),
    }

    nativeVibrate = (pattern) => {
        if (!Array.isArray(pattern)) {
            pattern = [pattern]
        }

        for (let i = 0; i < pattern.length; i++) {
            Haptics.vibrate({
                duration: pattern[i],
            })
        }
    }

    handleClickEvent = (event) => {
        const button = event.target.closest("button") || event.target.closest(".ant-btn")

        if (button) {
            this.vibrate("light")
        }
    }

    vibrate(pattern = "light") {
        const disabled = HapticsCore.isGlobalDisabled()

        if (disabled) {
            return false
        }

        if (typeof pattern === "string") {
            pattern = vibrationPatterns[pattern]
        }

        return navigator.vibrate(pattern)
    }
}