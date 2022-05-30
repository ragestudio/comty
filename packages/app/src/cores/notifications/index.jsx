import Core from "evite/src/core"
import React from "react"
import { notification as Notf } from "antd"
import { Icons, createIconRender } from "components/Icons"
import { Translation } from "react-i18next"
import { Haptics } from "@capacitor/haptics"

export default class NotificationCore extends Core {
    events = {
        "changeNotificationsSoundVolume": (value) => {
            this.playAudio({ soundVolume: value })
        },
        "changeNotificationsVibrate": (value) => {
            this.playHaptic({
                vibrationEnabled: value,
            })
        }
    }

    publicMethods = {
        notification: this
    }

    getSoundVolume = () => {
        return (window.app.settings.get("notifications_sound_volume") ?? 50) / 100
    }

    new = (notification, options = {}) => {
        this.notify(notification, options)
        this.playHaptic(options)
        this.playAudio(options)
    }

    notify = (notification, options = {}) => {
        if (typeof notification === "string") {
            notification = {
                title: "New notification",
                description: notification
            }
        }

        Notf.open({
            message: <Translation>
                {(t) => t(notification.title)}
            </Translation>,
            description: <Translation>
                {(t) => t(notification.description)}
            </Translation>,
            duration: notification.duration ?? 4,
            icon: React.isValidElement(notification.icon) ? notification.icon : (createIconRender(notification.icon) ?? <Icons.Bell />),
        })
    }

    playHaptic = async (options = {}) => {
        const vibrationEnabled = options.vibrationEnabled ?? window.app.settings.get("notifications_vibrate")

        if (vibrationEnabled) {
            await Haptics.vibrate()
        }
    }

    playAudio = (options = {}) => {
        const soundEnabled = options.soundEnabled ?? window.app.settings.get("notifications_sound")
        const soundVolume = options.soundVolume ? options.soundVolume / 100 : this.getSoundVolume()

        if (soundEnabled) {
            if (typeof window.app.sound?.play === "function") {
                window.app.sound.play("notification", {
                    volume: soundVolume,
                })
            }
        }
    }
}