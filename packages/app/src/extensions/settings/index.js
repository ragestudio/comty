import store from "store"
import defaultSettings from "schemas/defaultSettings.json"

class SettingsController {
    constructor() {
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

        window.app.eventBus.emit("setting_update", { key, value })

        return this.settings
    }

    get = (key) => {
        if (typeof key === "undefined") {
            return this.settings
        }

        return this.settings[key]
    }
}

export default {
    key: "settings",
    expose: [
        {
            initialization: [
                (app, main) => {
                    app.settingsController = new SettingsController()
                    window.app.settings = app.settingsController
                }
            ]
        },
    ]

}