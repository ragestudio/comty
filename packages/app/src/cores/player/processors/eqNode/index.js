import ProcessorNode from "../../processorNode"
import AudioPlayerStorage from "../../storage"

export default class EqProcessorNode extends ProcessorNode {
    static refName = "eq"
    static lock = true

    static defaultEqValue = {
        32: {
            gain: 0,
        },
        64: {
            gain: 0,
        },
        125: {
            gain: 0,
        },
        250: {
            gain: 0,
        },
        500: {
            gain: 0,
        },
        1000: {
            gain: 0,
        },
        2000: {
            gain: 0,
        },
        4000: {
            gain: 0,
        },
        8000: {
            gain: 0,
        },
        16000: {
            gain: 0,
        }
    }

    state = {
        eqValues: AudioPlayerStorage.get("eq_values") ?? EqProcessorNode.defaultEqValue,
    }

    exposeToPublic = {
        modifyValues: function (values) {
            Object.keys(values).forEach((key) => {
                if (isNaN(key)) {
                    delete values[key]
                }
            })

            this.state.eqValues = {
                ...this.state.eqValues,
                ...values,
            }

            AudioPlayerStorage.set("eq_values", this.state.eqValues)

            this.applyValues()
        }.bind(this),
        resetDefaultValues: function () {
            this.exposeToPublic.modifyValues(EqProcessorNode.defaultEqValue)

            return this.state
        }.bind(this),
        values: () => this.state,
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
                gain: parseFloat(entry[1].gain),
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

    applyValues() {
        // apply to current instance
        this.processor.eqNodes.forEach((processor) => {
            const gainValue = this.state.eqValues[processor.frequency.value].gain

            if (processor.gain.value !== gainValue) {
                console.debug(`[EQ] Applying values to ${processor.frequency.value} Hz frequency with gain ${gainValue}`)
                processor.gain.value = this.state.eqValues[processor.frequency.value].gain
            }
        })
    }
}