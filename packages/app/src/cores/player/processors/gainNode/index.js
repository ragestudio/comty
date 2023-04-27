import AudioPlayerStorage from "../../storage"
import ProcessorNode from "../../processorNode"

export default class GainProcessorNode extends ProcessorNode {
    static refName = "gain"

    static lock = true

    static defaultValues = {
        volume: 0.3,
    }

    state = {
        volume: AudioPlayerStorage.get("volume") ?? GainProcessorNode.defaultValues,
    }

    async init() {
        if (!this.audioContext) {
            throw new Error("audioContext is required")
        }

        this.processor = this.audioContext.createGain()

        // set the default values
        this.processor.gain.value = parseFloat(this.state.volume)
    }

    mutateInstance(instance) {
        if (!instance) {
            throw new Error("instance is required")
        }

        instance.gainNode = this.processor

        return instance
    }
}