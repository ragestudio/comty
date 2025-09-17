import Core from "vessel/core"

import createClient from "comty.js"

import request from "comty.js/request"
import measurePing from "comty.js/utils/measurePing"
import useRequest from "comty.js/hooks/useRequest"

export default class APICore extends Core {
	static namespace = "api"

	static bgColor = "coral"
	static textColor = "black"

	client = null
	mainSocketReconnecting = false

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
		"wsmanager:main:reconnecting": () => {
			app.cores.notifications.new({
				key: "main-socket-reconnect",
				type: "loading",
				title: "Reconnecting to socket",
				description:
					"Something fails with the connection, we are trying to reconnect.\n Some features may not work!",
				duration: 0,
			})

			this.mainSocketReconnecting = true
		},
		"wsmanager:main:reconnected": () => {
			if (this.mainSocketReconnecting) {
				this.mainSocketReconnecting = false

				app.cores.notifications.close("main-socket-reconnect")
				app.cores.notifications.new({
					key: "main-socket-reconnect",
					type: "success",
					title: "Reconnected to socket",
				})
			}
		},
	}

	getWebsocketClient(namespace) {
		if (!this.client.ws?.sockets) {
			return null
		}

		const instance = this.client.ws.sockets.get(namespace)

		if (!instance) {
			this.console.error(
				`Websocket with namespace [${namespace}] not found`,
			)
			return null
		}

		return instance
	}

	joinTopic(subscribeEvent, topic, instance = "main") {
		instance = this.getWebsocketClient(instance)

		if (!instance) {
			return false
		}

		return instance.topics.subscribe(subscribeEvent, topic)
	}

	leaveTopic(unsubscribeEvent, topic, instance = "main") {
		instance = this.getWebsocketClient(instance)

		if (!instance) {
			return false
		}

		return instance.topics.unsubscribe(unsubscribeEvent, topic)
	}

	emitEvent(key, data, instance = "main") {
		instance = this.getWebsocketClient(instance)

		if (!instance) {
			return false
		}

		return instance.emit(key, data)
	}

	listenEvent(key, handler, instance = "main") {
		instance = this.getWebsocketClient(instance)

		if (!instance) {
			return false
		}

		return instance.on(key, handler)
	}

	unlistenEvent(key, handler, instance = "main") {
		instance = this.getWebsocketClient(instance)

		if (!instance) {
			return false
		}

		return instance.off(key, handler)
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
		await fetch({
			url: this.client.mainOrigin,
			method: "HEAD",
		}).catch((error) => {
			this.console.error("Ping error", error)

			throw new Error(`Could not connect to the API`)
		})

		return this.client
	}
}
