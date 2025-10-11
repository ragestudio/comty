import upgrade from "./upgrade"
import open from "./open"
import close from "./close"
import message from "./message"

import { connect, JSONCodec } from "nats"

import Events from "./events"

import dispatchToUpstream from "./handlers/dispatchToUpstream"
import handleDownstream from "./handlers/handleDownstream"
import handleOperation from "./handlers/handleOperation"

export default class WebsocketGateway {
	constructor(gateway) {
		this.gateway = gateway
	}

	nats = null

	clients = new Map()
	userIdRefs = new Map()

	codec = JSONCodec()

	initialize = async () => {
		console.log(`Connecting to NATS server ["nats://localhost:4222"]`)
		this.nats = await connect({
			servers: "nats://localhost:4222",
		})

		this.jetstream = await this.nats.jetstream()
		this.jetstreamManager = await this.nats.jetstreamManager()

		// register & listen upstream events
		await this.jetstreamManager.streams.add({
			name: `UPSTREAM`,
			subjects: [`upstream.*`],
		})

		// register & listen downstream events
		this.downstreamSub = await this.nats.subscribe(`downstream`)
		this.operationsSub = await this.nats.subscribe(`operations`)

		// create downstream & operations loop
		const downstreamLoop = async () => {
			for await (const message of this.downstreamSub) {
				this.handleDownstream(message)
			}
		}

		const operationsLoop = async () => {
			for await (const message of this.operationsSub) {
				this.handleOperation(message)
			}
		}

		// register custom handlers
		for (const [event, handler] of Object.entries(Events)) {
			this.gateway.events.set(event, {
				handler: handler.bind(this),
			})
		}

		downstreamLoop()
		operationsLoop()

		console.log(`Conected to NATS server [${this.nats.getServer()}]`)
	}

	dispatchToUpstream = dispatchToUpstream.bind(this)
	handleDownstream = handleDownstream.bind(this)
	handleOperation = handleOperation.bind(this)

	upgrade = upgrade.bind(this)
	open = open.bind(this)
	close = close.bind(this)
	message = message.bind(this)
}
