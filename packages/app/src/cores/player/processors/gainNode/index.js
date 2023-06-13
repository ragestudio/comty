import AudioPlayerStorage from "../../storage"
import ProcessorNode from "../../processorNode"

export default class GainProcessorNode extends ProcessorNode {
    static refName = "gain"

    static lock = true

    static defaultValues = {
        gain: 1,
    }

    state = {
        gain: AudioPlayerStorage.get("gain") ?? GainProcessorNode.defaultValues.gain,
    }

    exposeToPublic = {
        modifyValues: function (values) {
            this.state = {
                ...this.state,
                ...values,
            }

            AudioPlayerStorage.set("gain", this.state.gain)

            this.applyValues()
        }.bind(this),
        resetDefaultValues: function () {
            this.exposeToPublic.modifyValues(GainProcessorNode.defaultValues)

            return this.state
        }.bind(this),
        values: () => this.state,
    }

    applyValues() {
        // apply to current instance
        this.processor.gain.value = app.cores.player.volume() * this.state.gain
    }

    async init() {
        if (!this.audioContext) {
            throw new Error("audioContext is required")
        }

        this.processor = this.audioContext.createGain()

        this.applyValues()
    }

    mutateInstance(instance) {
        if (!instance) {
            throw new Error("instance is required")
        }

        instance.gainNode = this.processor

        return instance
    }
}