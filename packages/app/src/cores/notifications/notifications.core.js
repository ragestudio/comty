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

    onEvents = {
        "changeNotificationsSoundVolume": (value) => {
            NotificationFeedback.playAudio({
                soundVolume: value
            })
        },
        "changeNotificationsVibrate": (value) => {
            NotificationFeedback.playHaptic({
                vibrationEnabled: value,
            })
        }
    }

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
        await NotificationUI.notify(notification, options)
        await NotificationFeedback.feedback(options.type)
    }
}