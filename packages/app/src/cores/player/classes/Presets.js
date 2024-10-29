import AudioPlayerStorage from "../player.storage"

export default class Presets {
    constructor({
        storage_key,
        defaultPresetValue,
        onApplyValues,
    }) {
        if (!storage_key) {
            throw new Error("storage_key is required")
        }

        this.storage_key = storage_key
        this.defaultPresetValue = defaultPresetValue
        this.onApplyValues = onApplyValues

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
        if (!this.presets || !this.presets[this.currentPresetKey]) {
            return this.defaultPresetValue
        }

        return this.presets[this.currentPresetKey]
    }

    set currentPresetValues(values) {
        const newData = this.presets

        newData[this.currentPresetKey] = values

        this.presets = newData
    }

    applyValues() {
        if (typeof this.onApplyValues === "function") {
            this.onApplyValues(this.presets)
        }
    }

    deletePreset(key) {
        if (key === "default") {
            app.message.error("Cannot delete default preset")
            return false
        }

        // if current preset is deleted, change to default
        if (this.currentPresetKey === key) {
            this.changePreset("default")
        }

        let newData = this.presets

        delete newData[key]

        this.presets = newData

        this.applyValues()

        return newData
    }

    createPreset(key, values) {
        if (this.presets[key]) {
            app.message.error("Preset already exists")
            return false
        }

        let newData = this.presets

        newData[key] = values ?? this.defaultPresetValue

        this.applyValues()

        this.presets = newData

        return newData
    }

    changePreset(key) {
        // create new one
        if (!this.presets[key]) {
            this.presets[key] = this.defaultPresetValue
        }

        this.currentPresetKey = key

        this.applyValues()

        return this.presets[key]
    }

    setToCurrent(values) {
        this.currentPresetValues = {
            ...this.currentPresetValues,
            ...values,
        }

        this.applyValues()

        return this.currentPresetValues
    }

    async setCurrentPresetToDefault() {
        return await new Promise((resolve) => {
            app.layout.modal.confirm.confirm({
                title: "Reset to default values?",
                content: "Are you sure you want to reset to default values?",
                onOk: () => {
                    this.setToCurrent(this.defaultPresetValue)

                    resolve(this.currentPresetValues)
                }
            })
        })
    }
}