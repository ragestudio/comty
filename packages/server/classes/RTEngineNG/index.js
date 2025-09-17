import HyperExpress from "hyper-express"

class RTEngineNG {
	constructor(config = {}) {
		this.events = new Map()

		if (typeof config.events === "object") {
			for (const [event, handler] of Object.entries(config.events)) {
				this.events.set(event, handler)
			}
		}

		this.onUpgrade = config.onUpgrade || null
		this.onConnection = config.onConnection || null
		this.onDisconnection = config.onDisconnection || null
	}

	clients = new Set()

	router = new HyperExpress.Router()

	senders = {
		broadcast: async (event, data) => {
			for (const client of this.clients) {
				this.sendMessage(client, event, data)
			}
		},
	}

	sendMessage = (socket, event, data) => {
		const payload = JSON.stringify({ event, data })

		socket.send(payload)
	}

	sendToTopic = (socket, topic, event, data, self = false) => {
		const payload = JSON.stringify({
			topic,
			event,
			data,
		})

		socket.publish(topic, payload)

		if (self === true) {
			this.sendMessage(socket, event, data)
		}
	}

	sendError = (socket, error) => {
		if (error instanceof Error) {
			error = error.toString()
		}

		this.sendMessage(socket, "error", error)
	}

	handleMessage = async (socket, payload) => {
		try {
			const message = JSON.parse(payload)

			if (typeof message.event !== "string") {
				return this.sendError(socket, "Invalid event type")
			}

			const handler = this.events.get(message.event)

			if (typeof handler === "function") {
				const handlerSenders = {
					...this.senders,
					toTopic: (room, event, data, self) => {
						this.sendToTopic(socket, room, event, data, self)
					},
					send: (event, data) => {
						this.sendMessage(socket, event, data)
					},
					error: (error) => {
						this.sendError(socket, error)
					},
				}

				await handler(socket, message.data, handlerSenders)
			} else {
				this.sendError(socket, "Event handler not found")
			}
		} catch (error) {
			this.sendError(socket, error)
		}
	}

	handleConnection = async (socket) => {
		socket.on("close", () => this.handleDisconnection(socket))
		socket.on("message", (payload) => this.handleMessage(socket, payload))

		if (this.onConnection) {
			await this.onConnection(socket)
		}

		this.clients.add(socket)
	}

	handleDisconnection = async (socket) => {
		if (this.onDisconnection) {
			await this.onDisconnection(socket)
		}

		this.clients.delete(socket)
	}

	handleUpgrade = async (req, res) => {
		try {
			const context = {
				id: nanoid(),
				token: req.query.token,
				user: null,
				httpHeaders: req.headers,
			}

			if (typeof this.onUpgrade === "function") {
				res.upgrade(await this.onUpgrade(context, req.query.token))
			} else {
				res.upgrade(context)
			}
		} catch (error) {
			console.error("Error upgrading connection:", error)
			res.status(401).end()
		}
	}

	registerEvent = (event, handler) => {
		this.events.set(event, handler)
	}

	registerEvents = (obj) => {
		for (const [event, handler] of Object.entries(obj)) {
			this.registerEvent(event, handler)
		}
	}

	initialize = async (engine) => {
		this.engine = engine

		this.router.ws("/", this.handleConnection)
		this.router.upgrade("/", this.handleUpgrade)

		this.engine.app.use("/", this.router)

		console.log(`✅ RTEngineNG initialized with ${this.events.size} events`)
	}
}

export default RTEngineNG
