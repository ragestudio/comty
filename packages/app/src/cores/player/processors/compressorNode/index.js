import { Modal } from "antd"
import ProcessorNode from "../node"
import Presets from "../../presets"

export default class CompressorProcessorNode extends ProcessorNode {
    constructor(props) {
        super(props)

        this.presets_controller = new Presets({
            storage_key: "compressor",
            defaultPresetValue: {
                threshold: -50,
                knee: 40,
                ratio: 12,
                attack: 0.003,
                release: 0.25,
            },
        })

        this.state = {
            compressorValues: this.presets_controller.currentPresetValues,
        }

        this.exposeToPublic = {
            presets: new Proxy(this.presets_controller, {
                get: function (target, key) {
                    if (!key) {
                        return target
                    }

                    return target[key]
                }
            }),
            deletePreset: this.deletePreset.bind(this),
            createPreset: this.createPreset.bind(this),
            changePreset: this.changePreset.bind(this),
            resetDefaultValues: this.resetDefaultValues.bind(this),
            modifyValues: this.modifyValues.bind(this),
            detach: this._detach.bind(this),
            attach: this._attach.bind(this),
            values: this.state.compressorValues,
        }
    }

    static refName = "compressor"
    static dependsOnSettings = ["player.compressor"]

    deletePreset(key) {
        this.changePreset("default")

        this.presets_controller.deletePreset(key)

        return this.presets_controller.presets
    }

    createPreset(key, values) {
        this.state = {
            ...this.state,
            compressorValues: this.presets_controller.createPreset(key, values),
        }

        this.presets_controller.changePreset(key)

        return this.presets_controller.presets
    }

    changePreset(key) {
        const values = this.presets_controller.changePreset(key)

        this.state = {
            ...this.state,
            compressorValues: values,
        }

        this.applyValues()

        return values
    }

    modifyValues(values) {
        values = this.presets_controller.setToCurrent(values)

        this.state.compressorValues = {
            ...this.state.compressorValues,
            ...values,
        }

        this.applyValues()

        return this.state.compressorValues
    }

    async resetDefaultValues() {
        return await new Promise((resolve) => {
            Modal.confirm({
                title: "Reset to default values?",
                content: "Are you sure you want to reset to default values?",
                onOk: () => {
                    this.modifyValues(this.presets_controller.defaultPresetValue)

                    resolve(this.state.compressorValues)
                },
                onCancel: () => {
                    resolve(this.state.compressorValues)
                }
            })
        })
    }

    async init(AudioContext) {
        if (!AudioContext) {
            throw new Error("AudioContext is required")
        }

        this.processor = AudioContext.createDynamicsCompressor()

        this.applyValues()
    }

    applyValues() {
        Object.keys(this.state.compressorValues).forEach((key) => {
            this.processor[key].value = this.state.compressorValues[key]
        })
    }
}