import { Core } from "@ragestudio/vessel"

import createClient from "comty.js"

import request from "comty.js/request"
import measurePing from "comty.js/utils/measurePing"
import useRequest from "comty.js/hooks/useRequest"

export default class APICore extends Core {
	static namespace = "api"

	static bgColor = "coral"
	static textColor = "black"

	client = null

	public = {
		client: function () {
			return this.client
		}.bind(this),
		customRequest: request,
		joinTopic: this.joinTopic.bind(this),
		leaveTopic: this.leaveTopic.bind(this),
		listenEvent: this.listenEvent.bind(this),
		unlistenEvent: this.unlistenEvent.bind(this),
		emitEvent: this.emitEvent.bind(this),
		reset: this.reset.bind(this),
		measurePing: measurePing,
		useRequest: useRequest,
	}

	registerSocketListeners = (map) => {
		Object.entries(map).forEach(([namespace, listeners]) => {
			Object.entries(listeners).forEach(([event, handler]) => {
				this.listenEvent(event, handler, namespace)
			})
		})
	}

	onRuntimeEvents = {
		"authmanager:authed": async () => {
			this.console.debug("auth manager started, connecting to websockets")
			await this.client.ws.connectAll()
		},
		"authmanager:logout": async () => {
			this.console.debug(
				"auth manager started, disconnecting from websockets",
			)
			await this.client.ws.disconnectAll()
		},
	}

	joinTopic(instance = "main", topic) {
		if (!this.client.ws.sockets.get(instance)) {
			this.console.error(`Websocket instance [${instance}] not found`)
			return false
		}

		return this.client.ws.sockets.get(instance).topics.subscribe(topic)
	}

	leaveTopic(instance = "main", topic) {
		if (!this.client.ws.sockets.get(instance)) {
			this.console.error(`Websocket instance [${instance}] not found`)
			return false
		}

		return this.client.ws.sockets.get(instance).topics.unsubscribe(topic)
	}

	emitEvent(instance = "main", key, data) {
		if (!this.client.ws.sockets.get(instance)) {
			this.console.error(`Websocket instance [${instance}] not found`)

			return false
		}

		return this.client.ws.sockets.get(instance).emit(key, data)
	}

	listenEvent(key, handler, instance = "main") {
		if (!this.client.ws.sockets.get(instance)) {
			this.console.error(`Websocket instance [${instance}] not found`)

			return false
		}

		return this.client.ws.sockets.get(instance).on(key, handler)
	}

	unlistenEvent(key, handler, instance = "main") {
		if (!this.client.ws.sockets.get(instance)) {
			this.console.error(`Websocket instance [${instance}] not found`)

			return false
		}

		return this.client.ws.sockets.get(instance).off(key, handler)
	}

	async reset() {
		this.client.ws.connectAll()
	}

	async onInitialize() {
		this.client = await createClient({
			eventBus: app.eventBus,
			ws: {
				enable: true,
				autoConnect: false,
			},
		})

		// make a basic request to check if the API is available
		await this.client
			.baseRequest({
				method: "head",
				url: "/",
			})
			.catch((error) => {
				this.console.error("Ping error", error)

				throw new Error(`
                Could not connect to the API.
                Please check your connection and try again.
            `)
			})

		return this.client
	}
}
