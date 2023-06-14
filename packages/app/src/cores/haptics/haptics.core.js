import Core from "evite/src/core"

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
        document.addEventListener("click", this.handleClickEvent)
    }

    public = {
        isGlobalDisabled: HapticsCore.isGlobalDisabled,
        vibrate: this.vibrate.bind(this),
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