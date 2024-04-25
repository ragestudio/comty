import Core from "evite/src/core"

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
    }

    async new(notification, options = {}) {
        NotificationUI.notify(notification, options)
        NotificationFeedback.feedback(options.type)
    }
}