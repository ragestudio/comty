export default class ProcessorNode {
    constructor(PlayerCore) {
        if (!PlayerCore) {
            throw new Error("PlayerCore is required")
        }

        this.PlayerCore = PlayerCore
        this.audioContext = PlayerCore.audioContext
    }

    async _init() {
        // check if has init method
        if (typeof this.init === "function") {
            await this.init(this.audioContext)
        }

        // check if has declared bus events
        if (typeof this.busEvents === "object") {
            Object.entries(this.busEvents).forEach((event, fn) => {
                app.eventBus.on(event, fn)
            })
        }

        return this
    }

    _attach(instance, index) {
        if (typeof instance !== "object") {
            instance = this.PlayerCore.currentAudioInstance
        }

        // check if has dependsOnSettings
        if (Array.isArray(this.constructor.dependsOnSettings)) {
            // check if the instance has the settings
            if (!this.constructor.dependsOnSettings.every((setting) => app.cores.settings.get(setting))) {
                console.warn(`Skipping attachment for [${this.constructor.refName ?? this.constructor.name}] node, cause is not passing the settings dependecy > ${this.constructor.dependsOnSettings.join(", ")}`)

                return instance
            }
        }

        // if index is not defined, attach to the last node
        if (!index) {
            index = instance.attachedProcessors.length
        }

        const prevNode = instance.attachedProcessors[index - 1]
        const nextNode = instance.attachedProcessors[index + 1]

        // first check if has prevNode and if is connected to the destination
        if (prevNode && prevNode.processor.numberOfOutputs > 0) {
            // if has outputs, disconnect from the next node
            prevNode.processor.disconnect()
        }

        if (prevNode) {
            prevNode.processor.connect(this.processor)
        } else {
            // it means that this is the first node, so connect to the source
            instance.track.connect(this.processor)
        }

        // now, connect the processor to the next node
        if (nextNode) {
            this.processor.connect(nextNode.processor)
        } else {
            // it means that this is the last node, so connect to the destination
            this.processor.connect(this.audioContext.destination)
        }

        // add to the attachedProcessors
        instance.attachedProcessors.splice(index, 0, this)

        if (typeof this.mutateInstance === "function") {
            instance = this.mutateInstance(instance)
        }

        return instance
    }

    _detach(instance) {
        if (typeof instance !== "object") {
            instance = this.PlayerCore.currentAudioInstance
        }

        // find index of the node within the attachedProcessors serching for matching refName
        const index = instance.attachedProcessors.findIndex((node) => {
            return node.constructor.refName === this.constructor.refName
        })

        if (index === -1) {
            console.warn(`Node [${this.constructor.refName ?? this.constructor.name}] is not attached to the given instance`)

            return instance
        }

        // retrieve the previous and next nodes
        const prevNode = instance.attachedProcessors[index - 1]
        const nextNode = instance.attachedProcessors[index + 1]

        // check if has previous node and if has outputs
        if (prevNode && prevNode.processor.numberOfOutputs > 0) {
            // if has outputs, disconnect from the previous node
            prevNode.processor.disconnect()
        }

        // disconnect 
        this.processor.disconnect()

        // now, connect the previous node to the next node
        if (prevNode && nextNode) {
            prevNode.processor.connect(nextNode.processor)
        } else {
            // it means that this is the last node, so connect to the destination
            prevNode.processor.connect(this.audioContext.destination)
        }

        // remove from the attachedProcessors
        instance.attachedProcessors.splice(index, 1)

        return instance
    }
}