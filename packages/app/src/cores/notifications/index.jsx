import Core from "evite/src/core"
import React from "react"
import { notification as Notf } from "antd"
import { Icons, createIconRender } from "components/Icons"
import { Translation } from "react-i18next"
import { Haptics } from "@capacitor/haptics"

export default class NotificationCore extends Core {
    static refName = "notifications"

    onEvents = {
        "changeNotificationsSoundVolume": (value) => {
            this.playAudio({ soundVolume: value })
        },
        "changeNotificationsVibrate": (value) => {
            this.playHaptic({
                vibrationEnabled: value,
            })
        }
    }

    registerToApp = {
        notification: this
    }

    getSoundVolume = () => {
        return (window.app.cores.settings.get("notifications_sound_volume") ?? 50) / 100
    }

    new = (notification, options = {}) => {
        this.notify(notification, options)
        this.playHaptic(options)
        this.playAudio(options)
    }

    notify = (notification, options = {
        type: "info"
    }) => {
        if (typeof notification === "string") {
            notification = {
                title: "New notification",
                description: notification
            }
        }

        const notfObj = {
            duration: notification.duration ?? 4,
        }

        if (notification.title) {
            switch (typeof notification.title) {
                case "function": {
                    notfObj.message = React.createElement(notification.title)

                    break
                }
                case "object": {
                    notfObj.message = notification.title

                    break
                }
                default: {
                    notfObj.message = <Translation>
                        {(t) => t(notification.title)}
                    </Translation>

                    break
                }
            }
        }

        if (notification.description) {
            switch (typeof notification.description) {
                case "function": {
                    notfObj.description = React.createElement(notification.description)

                    break
                }

                case "object": {
                    notfObj.description = notification.description

                    break
                }

                default: {
                    notfObj.description = <Translation>
                        {(t) => t(notification.description)}
                    </Translation>

                    break
                }
            }
        }

        if (notification.icon) {
            notfObj.icon = React.isValidElement(notification.icon) ? notification.icon : (createIconRender(notification.icon) ?? <Icons.Bell />)
        }

        if (typeof Notf[options.type] !== "function") {
            options.type = "info"
        }

        return Notf[options.type](notfObj)
    }

    playHaptic = async (options = {}) => {
        const vibrationEnabled = options.vibrationEnabled ?? window.app.cores.settings.get("notifications_vibrate")

        if (vibrationEnabled) {
            await Haptics.vibrate()
        }
    }

    playAudio = (options = {}) => {
        const soundEnabled = options.soundEnabled ?? window.app.cores.settings.get("notifications_sound")
        const soundVolume = options.soundVolume ? options.soundVolume / 100 : this.getSoundVolume()

        if (soundEnabled) {
            if (typeof window.app.cores.sound?.play === "function") {
                window.app.cores.sound.play("notification", {
                    volume: soundVolume,
                })
            }
        }
    }
}