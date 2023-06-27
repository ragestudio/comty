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

        if (typeof this.processor._last === "undefined") {
            this.processor._last = this.processor
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

        const currentIndex = this._findIndex(instance)

        // check if is already attached
        if (currentIndex !== false) {
            console.warn(`[${this.constructor.refName ?? this.constructor.name}] node is already attached`)

            return instance
        }

        // first check if has prevNode and if is connected to something
        // if has, disconnect it
        // if it not has, its means that is the first node, so connect to the media source
        if (prevNode && prevNode.processor._last.numberOfOutputs > 0) {
            //console.log(`[${this.constructor.refName ?? this.constructor.name}] node is already attached to the previous node, disconnecting...`)
            // if has outputs, disconnect from the next node
            prevNode.processor._last.disconnect()

            // now, connect to the processor
            prevNode.processor._last.connect(this.processor)
        } else {
            //console.log(`[${this.constructor.refName ?? this.constructor.name}] node is the first node, connecting to the media source...`)
            instance.media.connect(this.processor)
        }

        // now, check if it has a next node
        // if has, connect to it
        // if not, connect to the destination
        if (nextNode) {
            this.processor.connect(nextNode.processor)
        }

        // add to the attachedProcessors
        instance.attachedProcessors.splice(index, 0, this)

        // handle instance mutation
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
        const index = this._findIndex(instance)

        if (!index) {
            return instance
        }

        // retrieve the previous and next nodes
        const prevNode = instance.attachedProcessors[index - 1]
        const nextNode = instance.attachedProcessors[index + 1]

        // check if has previous node and if has outputs
        if (prevNode && prevNode.processor._last.numberOfOutputs > 0) {
            // if has outputs, disconnect from the previous node
            prevNode.processor._last.disconnect()
        }

        // disconnect 
        instance = this._destroy(instance)

        // now, connect the previous node to the next node
        if (prevNode && nextNode) {
            prevNode.processor._last.connect(nextNode.processor)
        } else {
            // it means that this is the last node, so connect to the destination
            prevNode.processor._last.connect(this.audioContext.destination)
        }

        return instance
    }

    _destroy(instance) {
        if (typeof instance !== "object") {
            instance = this.PlayerCore.currentAudioInstance
        }

        const index = this._findIndex(instance)

        if (!index) {
            return instance
        }

        this.processor.disconnect()

        instance.attachedProcessors.splice(index, 1)

        return instance
    }

    _findIndex(instance) {
        if (!instance) {
            instance = this.PlayerCore.currentAudioInstance
        }

        if (!instance) {
            console.warn(`Instance is not defined`)

            return false
        }

        // find index of the node within the attachedProcessors serching for matching refName
        const index = instance.attachedProcessors.findIndex((node) => {
            return node.constructor.refName === this.constructor.refName
        })

        if (index === -1) {
            return false
        }

        return index
    }
}