import defaultAudioProccessors from "../processors"

export default class PlayerProcessors {
    constructor(player) {
        this.player = player
    }

    processors = []

    public = {}

    async initialize() {
        // if already exists audio processors, destroy all before create new
        if (this.processors.length > 0) {
            this.player.console.log("Destroying audio processors")

            this.processors.forEach((processor) => {
                this.player.console.log(`Destroying audio processor ${processor.constructor.name}`, processor)
                processor._destroy()
            })

            this.processors = []
        }

        // instanciate default audio processors
        for await (const defaultProccessor of defaultAudioProccessors) {
            this.processors.push(new defaultProccessor(this.player))
        }

        // initialize audio processors
        for await (const processor of this.processors) {
            if (typeof processor._init === "function") {
                try {
                    await processor._init(this.player.audioContext)
                } catch (error) {
                    this.player.console.error(`Failed to initialize audio processor ${processor.constructor.name} >`, error)
                    continue
                }
            }

            // check if processor has exposed public methods
            if (processor.exposeToPublic) {
                Object.entries(processor.exposeToPublic).forEach(([key, value]) => {
                    const refName = processor.constructor.refName

                    if (typeof this.public[refName] === "undefined") {
                        // by default create a empty object
                        this.player.public[refName] = {}
                    }

                    this.player.public[refName][key] = value
                })
            }
        }
    }

    async attachProcessorsToInstance(instance) {
        this.player.console.log(instance, this.processors)

        for await (const [index, processor] of this.processors.entries()) {
            if (processor.constructor.node_bypass === true) {
                instance.contextElement.connect(processor.processor)

                processor.processor.connect(this.player.audioContext.destination)

                continue
            }

            if (typeof processor._attach !== "function") {
                this.player.console.error(`Processor ${processor.constructor.refName} not support attach`)

                continue
            }

            instance = await processor._attach(instance, index)
        }

        const lastProcessor = instance.attachedProcessors[instance.attachedProcessors.length - 1].processor

        // now attach to destination
        lastProcessor.connect(this.player.audioContext.destination)

        return instance
    }
}