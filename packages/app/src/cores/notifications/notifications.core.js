import Core from "vessel/core"

import NotificationUI from "./ui"
import NotificationFeedback from "./feedback"

export default class NotificationCore extends Core {
	static namespace = "notifications"
	static depenpencies = ["settings"]

	public = {
		new: this.new,
		close: this.close,
	}

	async new(notification) {
		NotificationUI.notify(notification)
		NotificationFeedback.feedback(notification)
	}

	async close(id) {
		NotificationUI.close(id)
	}
}
