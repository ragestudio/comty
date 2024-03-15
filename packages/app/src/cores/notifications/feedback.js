import { Haptics } from "@capacitor/haptics"

const NotfTypeToAudio = {
    info: "notification",
    success: "notification",
    warning: "warn",
    error: "error",
}

class NotificationFeedback {
    static getSoundVolume = () => {
        return (window.app.cores.settings.get("notifications_sound_volume") ?? 50) / 100
    }

    static playHaptic = async (options = {}) => {
        const vibrationEnabled = options.vibrationEnabled ?? window.app.cores.settings.get("notifications_vibrate")

        if (vibrationEnabled) {
            await Haptics.vibrate()
        }
    }

    static playAudio = (options = {}) => {
        const soundEnabled = options.soundEnabled ?? window.app.cores.settings.get("notifications_sound")
        const soundVolume = options.soundVolume ? options.soundVolume / 100 : NotificationFeedback.getSoundVolume()

        if (soundEnabled) {
            if (typeof window.app.cores.sound?.play === "function") {
                const sound = options.sound ?? NotfTypeToAudio[options.type] ?? "notification"

                window.app.cores.sound.play(sound, {
                    volume: soundVolume,
                })
            }
        }
    }

    static async feedback(type) {
        NotificationFeedback.playHaptic(type)
        NotificationFeedback.playAudio(type)
    }
}

export default NotificationFeedback