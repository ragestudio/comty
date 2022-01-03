import store from 'store'
import { objectToArrayMap } from '@corenode/utils'
import defaultKeys from "schemas/defaultSettings.json"

class SettingsController {
    constructor() {
        this.storeKey = "app_settings"
        this.defaultSettings = defaultKeys

        this.settings = store.get(this.storeKey) ?? {}

        objectToArrayMap(this.defaultSettings).forEach((entry) => {
            if (typeof this.settings[entry.key] === "undefined") {
                this.settings[entry.key] = entry.value
            }
        })

        return this
    }

    _pull() {
        this.settings = { ...this.settings, ...store.get(this.storeKey) }
    }

    _push(update) {
        if (typeof update !== "undefined") {
            this.settings = { ...this.settings, ...update }
        }
        store.set(this.storeKey, this.settings)
    }

    is = (key, value) => {
        return this.settings[key] === value ? true : false
    }

    change = (key, to) => {
        let value = to ?? !this.settings[key] ?? true

        this.set(key, value)
        window.app.eventBus.emit("changeSetting", { key, value, to })

        return this.settings
    }

    set = (key, value) => {
        this.settings[key] = value
        store.set(this.storeKey, this.settings)

        return this.settings
    }

    get = (key) => {
        if (typeof key === "undefined") {
            return this.settings
        }
        return this.settings[key]
    }
}

export default SettingsController