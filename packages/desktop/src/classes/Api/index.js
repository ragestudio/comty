import http from "node:http"
import RadixRouter from "radix-router"

import handleRequest from "./request.js"
import localEndpoints from "./endpoints/index.js"

export default class Api {
	constructor(main) {
		this.main = main
	}

	static listenPort = 11150
	listenPort = Api.listenPort

	server = null
	router = new RadixRouter()

	async initialize() {
		try {
			this.server = http.createServer(handleRequest.bind(this))

			for (const endpoint of localEndpoints) {
				this.register(endpoint)
			}

			await this.server.listen(this.listenPort)

			this.server.on("error", (e) => {
				if (e.code === "EADDRINUSE") {
					console.error("Address in use, retrying...")

					setTimeout(() => {
						this.server.close()
						this.listenPort++
						this.server.listen(this.listenPort)
					}, 1000)
				}
			})

			console.log(`[api] Listening on http://localhost:${Api.listenPort}`)
		} catch (e) {
			console.error(`[api] Failed to initialize internal server:`, e)
			return
		}
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
