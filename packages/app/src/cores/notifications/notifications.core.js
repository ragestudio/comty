import { Core } from "vessel"

import NotificationUI from "./ui"
import NotificationFeedback from "./feedback"

export default class NotificationCore extends Core {
    static namespace = "notifications"
    static depenpencies = [
        "api",
        "settings",
    ]

    #newNotifications = []

    listenSockets = {
        "notifications": {
            "notification.new": (data) => {
                this.new(data)
            }
        }
    }

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