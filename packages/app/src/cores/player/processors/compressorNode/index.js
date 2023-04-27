import AudioPlayerStorage from "../../storage"
import ProcessorNode from "../../processorNode"

export default class CompressorProcessorNode extends ProcessorNode {
    static refName = "compressor"
    static dependsOnSettings = ["player.compressor"]
    static defaultCompressorValues = {
        threshold: -50,
        knee: 40,
        ratio: 12,
        attack: 0.003,
        release: 0.25,
    }

    state = {
        compressorValues: AudioPlayerStorage.get("compressor") ?? CompressorProcessorNode.defaultCompressorValues,
    }

    exposeToPublic = {
        modifyValues: function (values) {
            this.state.compressorValues = {
                ...this.state.compressorValues,
                ...values,
            }

            AudioPlayerStorage.set("compressor", this.state.compressorValues)

            this.applyValues()
        }.bind(this),
        resetDefaultValues: function () {
            this.exposeToPublic.modifyValues(CompressorProcessorNode.defaultCompressorValues)

            return this.state.compressorValues
        }.bind(this),
        detach: this._detach.bind(this),
        attach: this._attach.bind(this),
        values: this.state.compressorValues,
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