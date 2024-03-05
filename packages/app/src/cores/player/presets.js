import AudioPlayerStorage from "./player.storage"

export default class Presets {
    constructor({
        storage_key,
        defaultPresetValue,
    }) {
        if (!storage_key) {
            throw new Error("storage_key is required")
        }

        this.storage_key = storage_key
        this.defaultPresetValue = defaultPresetValue

        return this
    }

    get presets() {
        return AudioPlayerStorage.get(`${this.storage_key}_presets`) ?? {
            default: this.defaultPresetValue
        }
    }

    set presets(presets) {
        AudioPlayerStorage.set(`${this.storage_key}_presets`, presets)

        return presets
    }

    set currentPresetKey(key) {
        AudioPlayerStorage.set(`${this.storage_key}_current-key`, key)

        return key
    }

    get currentPresetKey() {
        return AudioPlayerStorage.get(`${this.storage_key}_current-key`) ?? "default"
    }

    get currentPresetValues() {
        const presets = this.presets
        const key = this.currentPresetKey

        if (!presets || !presets[key]) {
            return this.defaultPresetValue
        }

        return presets[key]
    }

    deletePreset(key) {
        if (key === "default") {
            app.message.error("Cannot delete default preset")
            return false
        }

        if (this.currentPresetKey === key) {
            this.changePreset("default")
        }

        let presets = this.presets

        delete presets[key]

        this.presets = presets

        return presets
    }

    createPreset(key, values) {
        let presets = this.presets

        if (presets[key]) {
            app.message.error("Preset already exists")
            return false
        }

        presets[key] = values ?? this.defaultPresetValue

        this.presets = presets

        return presets[key]
    }

    changePreset(key) {
        let presets = this.presets

        // create new one
        if (!presets[key]) {
            presets[key] = this.defaultPresetValue

            this.presets = presets
        }

        this.currentPresetKey = key

        return presets[key]
    }

    setToCurrent(values) {
        let preset = this.currentPresetValues

        preset = {
            ...preset,
            ...values,
        }

        // update presets
        let presets = this.presets

        presets[this.currentPresetKey] = preset

        this.presets = presets

        return preset
    }
}