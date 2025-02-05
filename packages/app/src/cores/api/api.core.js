import { Core } from "@ragestudio/vessel"

import createClient from "comty.js"

import request from "comty.js/request"
import measurePing from "comty.js/helpers/measurePing"
import useRequest from "comty.js/hooks/useRequest"
import { reconnectWebsockets, disconnectWebsockets } from "comty.js"

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
		listenEvent: this.listenEvent.bind(this),
		unlistenEvent: this.unlistenEvent.bind(this),
		measurePing: measurePing,
		useRequest: useRequest,
		reconnectWebsockets: reconnectWebsockets,
		disconnectWebsockets: disconnectWebsockets,
	}

	registerSocketListeners = (map) => {
		Object.entries(map).forEach(([namespace, listeners]) => {
			Object.entries(listeners).forEach(([event, handler]) => {
				this.listenEvent(event, handler, namespace)
			})
		})
	}

	listenEvent(key, handler, instance = "default") {
		if (!this.client.sockets[instance]) {
			this.console.error(`[API] Websocket instance ${instance} not found`)

			return false
		}

		return this.client.sockets[instance].on(key, handler)
	}

	unlistenEvent(key, handler, instance = "default") {
		if (!this.client.sockets[instance]) {
			this.console.error(`[API] Websocket instance ${instance} not found`)

			return false
		}

		return this.client.sockets[instance].off(key, handler)
	}

	async onInitialize() {
		this.client = await createClient({
			enableWs: true,
			//origin: "https://indev.comty.app/api"
		})

		this.client.eventBus.on("ws:disconnected", () => {
			app.cores.notifications.new({
				title: "Failed to connect to server",
				description:
					"The connection to the server was lost. Some features may not work properly.",
			})
		})

		this.client.eventBus.on("auth:login_success", () => {
			app.eventBus.emit("auth:login_success")
		})

		this.client.eventBus.on("auth:logout_success", () => {
			app.eventBus.emit("auth:logout_success")
		})

		this.client.eventBus.on("session.invalid", (error) => {
			app.eventBus.emit("session.invalid", error)
		})

		this.client.eventBus.on("auth:disabled_account", () => {
			app.eventBus.emit("auth:disabled_account")
		})

		// make a basic request to check if the API is available
		await this.client
			.baseRequest({
				method: "head",
				url: "/",
			})
			.catch((error) => {
				this.console.error("[API] Ping error", error)

				throw new Error(`
                Could not connect to the API.
                Please check your connection and try again.
            `)
			})

		return this.client
	}
}
