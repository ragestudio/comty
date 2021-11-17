import store from 'store'
import EventEmitter from "@foxify/events"
import { objectToArrayMap } from '@corenode/utils'
import handlers from 'core/handlers'

const defaultKeys = import('schemas/defaultSettings.json')

class SettingsController {
    constructor() {
        this.storeKey = "settings"
        this.defaultSettings = defaultKeys

        this.events = new EventEmitter()
        this.settings = store.get(this.storeKey) ?? {}

        objectToArrayMap(this.defaultSettings).forEach((entry) => {
            if (typeof this.settings[entry.key] === "undefined") {
                this.settings[entry.key] = entry.value
            }
        })

        this.events.on('changeSetting', (payload) => {
            if (typeof handlers[payload.id] === "function") {
                handlers[payload.id](payload)
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
        this.events.emit("changeSetting", { key, value, to })

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