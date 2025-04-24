import defaultAudioProccessors from "../processors"

export default class PlayerProcessors {
	constructor(base) {
		this.base = base
	}

	nodes = []
	attached = []

	public = {}

	async initialize() {
		// if already exists audio processors, destroy all before create new
		if (this.nodes.length > 0) {
			this.base.player.console.log("Destroying audio processors")

			this.nodes.forEach((node) => {
				this.base.player.console.log(
					`Destroying audio processor node ${node.constructor.name}`,
					node,
				)
				node._destroy()
			})

			this.nodes = []
		}

		// instanciate default audio processors
		for await (const defaultProccessor of defaultAudioProccessors) {
			this.nodes.push(new defaultProccessor(this))
		}

		// initialize audio processors
		for await (const node of this.nodes) {
			if (typeof node._init === "function") {
				try {
					await node._init()
				} catch (error) {
					this.base.player.console.error(
						`Failed to initialize audio processor node ${node.constructor.name} >`,
						error,
					)
					continue
				}
			}

			// check if processor has exposed public methods
			if (node.exposeToPublic) {
				Object.entries(node.exposeToPublic).forEach(([key, value]) => {
					const refName = node.constructor.refName

					if (typeof this.base.processors[refName] === "undefined") {
						// by default create a empty object
						this.base.processors[refName] = {}
					}

					this.base.processors[refName][key] = value
				})
			}
		}
	}

	attachAllNodes = async () => {
		for await (const [index, node] of this.nodes.entries()) {
			if (node.constructor.node_bypass === true) {
				this.base.context.elementSource.connect(node.processor)

				node.processor.connect(this.base.context.destination)

				continue
			}

			if (typeof node._attach !== "function") {
				this.base.console.error(
					`Processor ${node.constructor.refName} not support attach`,
				)

				continue
			}

			await node._attach(index)
		}

		const lastProcessor = this.attached[this.attached.length - 1].processor

		// now attach to destination
		lastProcessor.connect(this.base.context.destination)
	}

	detachAllNodes = async () => {
		for (const [index, node] of this.attached.entries()) {
			await node._detach()
		}
	}
}
