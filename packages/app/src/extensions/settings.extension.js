import { Extension } from "evite"
import store from "store"
import defaultSettings from "schemas/defaultSettings.json"
import { Observable } from "rxjs"

export default class SettingsExtension extends Extension {
    constructor(app, main) {
        super(app, main)
        this.storeKey = "app_settings"
        this.settings = store.get(this.storeKey) ?? {}

        this._setDefaultUndefined()
    }

    _setDefaultUndefined = () => {
        Object.keys(defaultSettings).forEach((key) => {
            const value = defaultSettings[key]

            // Only set default if value is undefined
            if (typeof this.settings[key] === "undefined") {
                this.settings[key] = value
            }
        })
    }

    defaults = (key) => {
        if (typeof key === "undefined") {
            return defaultSettings
        }

        return defaultSettings[key]
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

    window = {
        "settings": this
    }
}