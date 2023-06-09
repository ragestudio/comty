import Core from "evite/src/core"
import store from "store"
import defaultSettings from "schemas/defaultSettings.json"
import { Observable } from "rxjs"

export default class SettingsCore extends Core {
    static refName = "settings"
    
    static namespace = "settings"

    static storeKey = "app_settings"

    public = {
        is: this.is,
        set: this.set,
        get: this.get,
        getDefaults: this.getDefaults,
        withEvent: this.withEvent,
    }

    onInitialize() {
        const settings = this.get()

        // fulfillUndefinedWithDefaults
        Object.keys(defaultSettings).forEach((key) => {
            const value = defaultSettings[key]

            // Only set default if value is undefined
            if (typeof settings[key] === "undefined") {
                this.set(key, value)
            }
        })
    }

    is(key, value) {
        return this.get(key) === value
    }

    set(key, value) {
        const settings = this.get()

        settings[key] = value

        store.set(SettingsCore.storeKey, settings)

        window.app.eventBus.emit("setting.update", { key, value })
        window.app.eventBus.emit(`setting.update.${key}`, value)

        return settings
    }

    get(key) {
        const settings = store.get(SettingsCore.storeKey) ?? {}

        if (typeof key === "undefined") {
            return settings
        }

        return settings[key]
    }

    getDefaults(key) {
        if (typeof key === "undefined") {
            return defaultSettings
        }

        return defaultSettings[key]
    }

    withEvent(listenEvent, defaultValue) {
        let value = defaultValue ?? false

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