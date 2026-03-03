import Core from "vessel/core"
import * as idb from "idb"

import NotificationUI from "./ui"
import NotificationFeedback from "./feedback"

const DB_VERSION = 1
const DB_NAME = "notifications"
const STORE_NAME = "notifications"

export default class NotificationCore extends Core {
	static namespace = "notifications"
	static depenpencies = ["settings"]

	state = {
		hasOsPermision: false,
	}

	public = {
		new: this.new,
		close: this.close,
		unread: this.unread,
		state: this.state,
		ack: this.ack,
		ackAll: this.ackAll,
	}

	async unread() {
		if (!this.db) {
			return []
		}

		const notifications = await this.db.getAll(STORE_NAME)

		return notifications
	}

	async new(notification = {}) {
		notification.id =
			Date.now() + "_" + Math.random().toString(36).substring(2, 9)

		if (notification.ack === true && this.db) {
			await this.db
				.transaction(STORE_NAME, "readwrite")
				.objectStore(STORE_NAME)
				.add(notification)

			app.eventBus.emit("notification:ack:new", notification)
		}

		if (notification.ui !== false) {
			NotificationUI.notify(notification)
		}

		if (notification.feedback !== false) {
			NotificationFeedback.feedback(notification)
		}

		if (notification.os === true && this.state.hasOsPermision === true) {
			new window.Notification(notification.title ?? "Notification", {
				icon: notification.icon ?? "/icon-192.png",
				body: notification.description,
			})
		}
	}

	async ack(notf_id) {
		if (!this.db) {
			return null
		}

		const notification = await this.db.get(STORE_NAME, notf_id)

		console.log(notification)

		if (!notification) {
			return null
		}

		await this.db.delete(STORE_NAME, notf_id)

		app.eventBus.emit("notification:ack:del", notification)

		return notification
	}

	async ackAll() {
		if (!this.db) {
			return null
		}

		const notifications = await this.db.getAll(STORE_NAME)

		for (let notification of notifications) {
			this.db.delete(STORE_NAME, notification.id)
			app.eventBus.emit("notification:ack:del", notification)
		}
	}

	async close(id) {
		NotificationUI.close(id)
	}

	async onInitialize() {
		if (window.Notification) {
			window.Notification.requestPermission().then((permission) => {
				this.state.hasOsPermision = permission === "granted"
			})
		}

		this.db = await idb.openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: "id" })
				}
			},
		})
	}
}
