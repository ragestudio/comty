export default class ProcessorNode {
	constructor(manager) {
		if (!manager) {
			throw new Error("processorManager is required")
		}

		this.manager = manager
		this.audioContext = manager.base.context
		this.elementSource = manager.base.elementSource
		this.player = manager.base.player
	}

	async _init() {
		// check if has init method
		if (typeof this.init === "function") {
			await this.init()
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

	_attach(index) {
		// check if has dependsOnSettings
		if (Array.isArray(this.constructor.dependsOnSettings)) {
			// check if the instance has the settings
			if (
				!this.constructor.dependsOnSettings.every((setting) =>
					app.cores.settings.get(setting),
				)
			) {
				console.warn(
					`Skipping attachment for [${this.constructor.refName ?? this.constructor.name}] node, cause is not passing the settings dependecy > ${this.constructor.dependsOnSettings.join(", ")}`,
				)

				return null
			}
		}

		// if index is not defined, attach to the last node
		if (!index) {
			index = this.manager.attached.length
		}

		const prevNode = this.manager.attached[index - 1]
		const nextNode = this.manager.attached[index + 1]

		const currentIndex = this._findIndex()

		// check if is already attached
		if (currentIndex !== false) {
			console.warn(
				`[${this.constructor.refName ?? this.constructor.name}] node is already attached`,
			)

			return null
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
			this.elementSource.connect(this.processor)
		}

		// now, check if it has a next node
		// if has, connect to it
		// if not, connect to the destination
		if (nextNode) {
			this.processor.connect(nextNode.processor)
		}

		// add to the attachedProcessors
		this.manager.attached.splice(index, 0, this)

		// // handle instance mutation
		// if (typeof this.mutateInstance === "function") {
		// 	instance = this.mutateInstance(instance)
		// }

		return this
	}

	_detach() {
		// find index of the node within the attachedProcessors serching for matching refName
		const index = this._findIndex()

		if (!index) {
			return null
		}

		// retrieve the previous and next nodes
		const prevNode = this.manager.attached[index - 1]
		const nextNode = this.manager.attached[index + 1]

		// check if has previous node and if has outputs
		if (prevNode && prevNode.processor._last.numberOfOutputs > 0) {
			// if has outputs, disconnect from the previous node
			prevNode.processor._last.disconnect()
		}

		// disconnect
		this.processor.disconnect()
		this.manager.attached.splice(index, 1)

		// now, connect the previous node to the next node
		if (prevNode && nextNode) {
			prevNode.processor._last.connect(nextNode.processor)
		} else {
			// it means that this is the last node, so connect to the destination
			prevNode.processor._last.connect(this.audioContext.destination)
		}

		return this
	}

	_findIndex() {
		// find index of the node within the attachedProcessors serching for matching refName
		const index = this.manager.attached.findIndex((node) => {
			return node.constructor.refName === this.constructor.refName
		})

		if (index === -1) {
			return false
		}

		return index
	}
}
