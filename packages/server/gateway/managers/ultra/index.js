import uexpress from "ultimate-express"
import { URL } from "url"

import InternalConsole from "./console"
import WebsocketGateway from "./websocket"

import MainRequest from "./requests/main"
import PingRequest from "./requests/ping"
import ProxyRequest from "./requests/proxy"

export default class Ultra {
	constructor(config = {}, base) {
		this.config = config
		this.http = new uexpress()
		this.base = base

		this.console = new InternalConsole()
	}

	targets = new Map()
	websocketServices = new Map()
	events = new Map()

	websocket = new WebsocketGateway(this)

	async initialize() {
		await this.websocket.initialize()

		this.http.uwsApp.ws("/", this.websocket)

		this.http.get("/", MainRequest.bind(this))
		this.http.get("/ping", PingRequest.bind(this))
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

		if (params.websocket === true) {
			//this.console.debug("🏷️ Registering ws service:", params)

			return this.websocketServices.set(params.serviceId, {
				serviceId: params.serviceId,
				path: params.path,
				target: params.target,
				url: params.url,
			})
		}

		if (!params.websocket) {
			// register a http path
			//this.console.debug("🏷️ Registering target:", params)
			return this.targets.set(params.path.split("/")[1], {
				serviceId: params.serviceId,
				target: params.url.origin,
				url: new URL(params.url.origin),
			})
		}
	}

	async unregister(params) {
		this.console.debug("🏷️ Unregistering target:", params)
		this.targets.delete(params.path.split("/")[1])
	}

	async unregisterAllFromService(serviceId) {
		this.console.debug("🏷️ Unregistering all paths for service:", serviceId)

		for (const [path, service] of this.targets.entries()) {
			if (service.serviceId === serviceId) {
				this.targets.delete(path)
			}
		}

		return true
	}
}
