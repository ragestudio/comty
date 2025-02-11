//import { Haptics } from "@capacitor/haptics"

const NotfTypeToAudio = {
	info: "notification",
	success: "notification",
	warning: "warn",
	error: "error",
}

class NotificationFeedback {
	static getSoundVolume = () => {
		return (
			(window.app.cores.settings.get("sfx:notifications_volume") ?? 50) /
			100
		)
	}

	static playHaptic = async () => {
		if (app.cores.settings.get("haptics:notifications_feedback")) {
			//await Haptics.vibrate()
			//use navigator.vibrate
		}
	}

	static playAudio = (type) => {
		if (app.cores.settings.get("sfx:notifications_feedback")) {
			if (typeof window.app.cores.sfx?.play === "function") {
				window.app.cores.sfx.play(
					NotfTypeToAudio[type] ?? "notification",
					{
						volume: NotificationFeedback.getSoundVolume(),
					},
				)
			}
		}
	}

	static async feedback({ type = "notification", feedback = true }) {
		if (!feedback) {
			return false
		}

		NotificationFeedback.playHaptic(type)
		NotificationFeedback.playAudio(type)
	}
}

export default NotificationFeedback
