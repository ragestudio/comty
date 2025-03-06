import { Core } from "@ragestudio/vessel"

import NotificationUI from "./ui"
import NotificationFeedback from "./feedback"

export default class NotificationCore extends Core {
	static namespace = "notifications"
	static depenpencies = ["api", "settings"]

	listenSockets = {
		notifications: {
			"notification.new": (data) => {
				this.new(data)
			},
			"notification.broadcast": (data) => {
				this.new(data)
			},
		},
	}

	public = {
		new: this.new,
		close: this.close,
	}

	async onInitialize() {
		this.ctx.cores.get("api").registerSocketListeners(this.listenSockets)
	}

	async new(notification) {
		NotificationUI.notify(notification)
		NotificationFeedback.feedback(notification)
	}

	async close(id) {
		NotificationUI.close(id)
	}
}
