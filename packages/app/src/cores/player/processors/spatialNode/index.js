import AudioPlayerStorage from "../../player.storage"
import ProcessorNode from "../node"

export default class SpatialNode extends ProcessorNode {
    static refName = "spatial"

    static dependsOnSettings = ["player.spatial"]

    panner = this.audioContext.createPanner()

    state = {
        position: {
            x: 0,
            y: 0,
            z: 0,
        }
    }

    exposeToPublic = {
        panner: new Proxy(this.panner, {
            get: (target, property) => {
                if (!property) {
                    return target
                }

                return target[property]
            },

        }),
        updateLocation: this.updateLocation.bind(this),
    }

    updateLocation(x, y, z) {
        this.state.position.x = x
        this.state.position.y = y
        this.state.position.z = z

        this.applyValues()
    }

    applyValues() {
        // apply to current instance
        this.panner.setPosition(this.state.position.x, this.state.position.y, this.state.position.z)
    }

    async init() {
        if (!this.audioContext) {
            throw new Error("audioContext is required")
        }

        this.processor = this.panner

        this.processor.panningModel = "HRTF"
        this.processor.distanceModel = "inverse"
        this.processor.refDistance = 1
        this.processor.maxDistance = 15
        this.processor.rolloffFactor = 1;
        this.processor.coneInnerAngle = 360;
        this.processor.coneOuterAngle = 360;
        this.processor.coneOuterGain = 0;
    }
}