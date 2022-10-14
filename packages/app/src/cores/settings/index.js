import Core from "evite/src/core"
import store from "store"
import defaultSettings from "schemas/defaultSettings.json"
import { Observable } from "rxjs"

export default class SettingsCore extends Core {
    storeKey = "app_settings"

    settings = store.get(this.storeKey) ?? {}

    publicMethods = {
        settings: this
    }

    initialize() {
        this.fulfillUndefinedWithDefaults()
    }

    fulfillUndefinedWithDefaults = () => {
        Object.keys(defaultSettings).forEach((key) => {
            const value = defaultSettings[key]

            // Only set default if value is undefined
            if (typeof this.settings[key] === "undefined") {
                this.settings[key] = value
            }
        })
    }

    is = (key, value) => {
        return this.settings[key] === value
    }

    set = (key, value) => {
        this.settings[key] = value
        store.set(this.storeKey, this.settings)

        window.app.eventBus.emit("setting.update", { key, value })
        window.app.eventBus.emit(`setting.update.${key}`, value)

        return this.settings
    }

    get = (key) => {
        if (typeof key === "undefined") {
            return this.settings
        }

        return this.settings[key]
    }

    getDefaults = (key) => {
        if (typeof key === "undefined") {
            return defaultSettings
        }

        return defaultSettings[key]
    }

    withEvent = (listenEvent, defaultValue) => {
        let value = defaultValue ?? this.settings[key] ?? false

        const observable = new Observable((subscriber) => {
            subscriber.next(value)

            window.app.eventBus.on(listenEvent, (to) => {
                value = to
                subscriber.next(value)
            })
        })

        return observable.subscribe((value) => {
            return value
        })
    }
}