import type { ApiRoute } from "./types.js"
import type Main from "../../main.js"

import http from "node:http"
import RadixRouter from "radix-router"

import createRequestHandler from "./request.js"
import localEndpoints from "./endpoints/index.js"

export default class Api {
	static readonly listenPort = 11150

	listenPort = Api.listenPort
	server: http.Server | null = null
	router = new RadixRouter()

	constructor(readonly main: Main) {}

	async initialize() {
		try {
			const server = http.createServer(createRequestHandler(this))

			this.server = server

			for (const endpoint of localEndpoints) {
				this.register(endpoint)
			}

			await new Promise<void>((resolve, reject) => {
				server.on("error", (error: NodeJS.ErrnoException) => {
					if (error.code !== "EADDRINUSE") {
						reject(error)
						return
					}

					console.error("Address in use, retrying...")

					setTimeout(() => {
						this.listenPort++
						server.listen(this.listenPort)
					}, 1000)
				})

				server.once("listening", () => {
					console.log(`[api] Listening on http://localhost:${this.listenPort}`)
					resolve()
				})

				server.listen(this.listenPort)
			})
		} catch (error) {
			console.error("[api] Failed to initialize internal server:", error)
		}
	}

	register({ method, path, handler, such }: ApiRoute) {
		console.log("Registering api endpoint", {
			method,
			path,
			handler,
			such,
		})

		this.router.insert({
			path,
			method,
			handler,
			such,
		})
	}
}
