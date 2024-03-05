import { Modal } from "antd"
import ProcessorNode from "../node"
import Presets from "../../presets"

export default class EqProcessorNode extends ProcessorNode {
    constructor(props) {
        super(props)

        this.presets_controller = new Presets({
            storage_key: "eq",
            defaultPresetValue: {
                32: 0,
                64: 0,
                125: 0,
                250: 0,
                500: 0,
                1000: 0,
                2000: 0,
                4000: 0,
                8000: 0,
                16000: 0,
            },
        })

        this.state = {
            eqValues: this.presets_controller.currentPresetValues,
        }

        this.exposeToPublic = {
            presets: new Proxy(this.presets_controller, {
                get: function (target, key) {
                    if (!key) {
                        return target
                    }

                    return target[key]
                },
            }),
            deletePreset: this.deletePreset.bind(this),
            createPreset: this.createPreset.bind(this),
            changePreset: this.changePreset.bind(this),
            modifyValues: this.modifyValues.bind(this),
            resetDefaultValues: this.resetDefaultValues.bind(this),
        }
    }

    static refName = "eq"
    static lock = true

    deletePreset(key) {
        this.changePreset("default")

        this.presets_controller.deletePreset(key)

        return this.presets_controller.presets
    }

    createPreset(key, values) {
        this.state = {
            ...this.state,
            eqValues: this.presets_controller.createPreset(key, values),
        }

        this.presets_controller.changePreset(key)

        return this.presets_controller.presets
    }

    changePreset(key) {
        const values = this.presets_controller.changePreset(key)

        this.state = {
            ...this.state,
            eqValues: values,
        }

        this.applyValues()

        return values
    }

    modifyValues(values) {
        values = this.presets_controller.setToCurrent(values)

        this.state = {
            ...this.state,
            eqValues: values,
        }

        this.applyValues()

        return values
    }

    resetDefaultValues() {
        Modal.confirm({
            title: "Reset to default values?",
            content: "Are you sure you want to reset to default values?",
            onOk: () => {
                this.modifyValues(this.presets_controller.defaultPresetValue)
            }
        })

        return this.state.eqValues
    }

    applyValues() {
        // apply to current instance
        this.processor.eqNodes.forEach((processor) => {
            const gainValue = this.state.eqValues[processor.frequency.value]

            if (processor.gain.value !== gainValue) {
                console.debug(`[EQ] Applying values to ${processor.frequency.value} Hz frequency with gain ${gainValue}`)
                processor.gain.value = gainValue
            }
        })
    }

    async init() {
        if (!this.audioContext) {
            throw new Error("audioContext is required")
        }

        this.processor = this.audioContext.createGain()

        this.processor.gain.value = 1

        this.processor.eqNodes = []

        const values = Object.entries(this.state.eqValues).map((entry) => {
            return {
                freq: parseFloat(entry[0]),
                gain: parseFloat(entry[1]),
            }
        })

        values.forEach((eqValue, index) => {
            // chekc if freq and gain is valid
            if (isNaN(eqValue.freq)) {
                eqValue.freq = 0
            }
            if (isNaN(eqValue.gain)) {
                eqValue.gain = 0
            }

            this.processor.eqNodes[index] = this.audioContext.createBiquadFilter()
            this.processor.eqNodes[index].type = "peaking"
            this.processor.eqNodes[index].frequency.value = eqValue.freq
            this.processor.eqNodes[index].gain.value = eqValue.gain
        })

        // connect nodes
        for await (let [index, eqNode] of this.processor.eqNodes.entries()) {
            const nextNode = this.processor.eqNodes[index + 1]

            if (index === 0) {
                this.processor.connect(eqNode)
            }

            if (nextNode) {
                eqNode.connect(nextNode)
            }
        }

        // set last processor for processor node can properly connect to the next node
        this.processor._last = this.processor.eqNodes.at(-1)
    }
}