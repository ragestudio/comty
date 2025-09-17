import uexpress from "ultimate-express"
import { URL } from "url"

import InternalConsole from "./console"

import MainRequest from "./requests/main"
import WebsocketRequest from "./requests/websocket"
import ProxyRequest from "./requests/proxy"

export default class Ultra {
	constructor(config = {}, base) {
		this.config = config
		this.http = new uexpress()
		this.base = base
	}

	paths = new Map()
	events = new Map()
	websockets = new Map()

	console = new InternalConsole()

	async initialize() {
		this.http.uwsApp.ws("/", new WebsocketRequest(this))

		this.http.get("/", MainRequest.bind(this))
		this.http.all("/*", ProxyRequest.bind(this))

		this.http.listen(this.config.port, this.config.internalIp)
		this.console.log(
			`Gateway started on ${this.config.internalIp}:${this.config.port}`,
		)
	}

	async register(params) {
		if (!params.url) {
			params.url = new URL(params.target)
		}

		if (typeof params.secure === "undefined") {
			params.secure =
				params.url.protocol === "https:" ||
				params.url.protocol === "wss:"
		}

		// handle register websocket events
		if (params.websocket === true && typeof params.event === "string") {
			// this.console.debug("🏷️ Registering ws event:", {
			// 	serviceId: params.serviceId,
			// 	event: params.event,
			// })

			return this.events.set(params.event, {
				serviceId: params.serviceId,
				path: params.path,
				target: params.target,
			})
		}

		// handle registers websocket server
		if (params.websocket) {
			// this.console.debug("🏷️ Registering ws server:", {
			// 	serviceId: params.serviceId,
			// 	path: params.path,
			// 	target: params.target,
			// })

			return this.websockets.set(params.serviceId, {
				serviceId: params.serviceId,
				path: params.path,
				target: params.target,
			})
		}

		// register a http path
		this.console.debug("🏷️ Registering path:", params)
		return this.paths.set(params.path.split("/")[1], {
			serviceId: params.serviceId,
			path: params.path,
			target: params.target,
			url: params.url,
		})
	}

	async unregister(params) {
		this.console.debug("🏷️ Unregistering path:", params)
		this.paths.delete(params.path)
	}

	async unregisterAllFromService(serviceId) {
		this.console.debug("🏷️ Unregistering all paths for service:", serviceId)

		for (const [path, service] of this.paths.entries()) {
			if (service.serviceId === serviceId) {
				this.paths.delete(path)
			}
		}

		return true
	}
}
