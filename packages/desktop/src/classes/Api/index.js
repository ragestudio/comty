import http from "node:http"
import RadixRouter from "radix-router"

import handleRequest from "./request.js"
import localEndpoints from "./endpoints/index.js"

export default class Api {
	constructor(main) {
		this.main = main
	}

	static listenPort = 11150

	server = null
	router = new RadixRouter()

	async initialize() {
		this.server = http.createServer(handleRequest.bind(this))

		for (const endpoint of localEndpoints) {
			this.register(endpoint)
		}

		this.server.listen(Api.listenPort)

		console.log(`[api] Listening on http://localhost:${Api.listenPort}`)
	}

	register = ({ method, path, handler, such }) => {
		console.log("Registering api endpoint", {
			method,
			path,
			handler,
			such,
		})

		this.router.insert({
			path: path,
			method: method,
			handler: handler,
			such: such,
		})
	}
}
