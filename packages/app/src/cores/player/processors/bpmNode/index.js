import ProcessorNode from "../node"
import { createRealTimeBpmProcessor } from "realtime-bpm-analyzer"
import { Observable } from "object-observer"

export default class BPMProcessorNode extends ProcessorNode {
    static refName = "bpm"

    static node_bypass = true

    static lock = true

    state = Observable.from({
        bpm: 0,
        average_bpm: 0,
        current_stable_bpm: 0,
    })

    exposeToPublic = {
        state: this.state,
    }

    async init() {
        Observable.observe(this.state, async (changes) => {
            try {
                changes.forEach((change) => {
                    if (change.type === "update") {
                        const stateKey = change.path[0]

                        if (stateKey === "bpm") {
                            console.log("bpm update", this.state.bpm)
                            this.PlayerCore.eventBus.emit(`bpm.change`, this.state.bpm)
                        }

                        this.PlayerCore.eventBus.emit(`bpm.state.update:${stateKey}`, change.object[stateKey])
                        this.PlayerCore.eventBus.emit("bpm.state.update", change.object)
                    }
                })
            } catch (error) {
                console.error(`Failed to dispatch state updater >`, error)
            }
        })

        this.processor = await createRealTimeBpmProcessor(this.audioContext)

        this.processor.port.postMessage({
            message: "ASYNC_CONFIGURATION",
            parameters: {
                continuousAnalysis: true,
                stabilizationTime: 5_000,
            }
        })

        this.processor.port.onmessage = (event) => {
            if (event.data.message === "BPM") {
                const average_bpm = event.data.result.bpm[0]?.tempo ?? 0

                if (average_bpm !== this.state.average_bpm) {
                    this.state.average_bpm = average_bpm

                    if (average_bpm > 0) {
                        if (this.state.stable_bpm < average_bpm) {
                            this.state.bpm = this.state.average_bpm
                        } else {
                            this.state.bpm = this.state.stable_bpm
                        }
                    } else if (this.state.stable_bpm > 0) {
                        this.state.bpm = this.state.stable_bpm
                    }
                }
            }

            if (event.data.message === "BPM_STABLE") {
                const stable_bpm = event.data.result.bpm[0]?.tempo ?? 0

                this.state.stable_bpm = stable_bpm
            }
        }
    }
}