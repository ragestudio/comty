import type { IncomingMessage, ServerResponse } from "node:http"

import type Api from "./index.js"
import type { ApiRequest, ApiResponse, ApiRoute } from "./types.js"

// helper to safely stringify json and avoid circular references
const safeStringify = (value: unknown): string | undefined => {
	const seen = new WeakSet()

	return JSON.stringify(value, (key, item) => {
		if (item != null && typeof item === "object") {
			if (seen.has(item)) {
				return "[Circular]"
			}

			seen.add(item)
		}

		return item
	})
}

export default function createRequestHandler(api: Api) {
	return async (rawReq: IncomingMessage, rawRes: ServerResponse) => {
		const req = rawReq as ApiRequest
		const res = rawRes as ApiResponse

		try {
			const startHrTime = process.hrtime()

			res.status = (code) => {
				res.statusCode = code
				return res
			}

			res.json = (data) => {
				res.end(safeStringify(data))
			}

			// allow cors
			res.setHeader("Access-Control-Allow-Origin", "*")

			// disable cache
			res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
			res.setHeader("Expires", "0")

			// set content type as json by default
			res.setHeader("Content-Type", "application/json")

			// parse request body for post, put and patch methods
			if (["POST", "PUT", "PATCH"].includes(req.method ?? "")) {
				await new Promise<void>((resolve, reject) => {
					let body = ""

					req.on("data", (chunk) => {
						body += chunk.toString()
					})

					req.on("end", () => {
						try {
							const contentType = req.headers["content-type"] ?? ""

							if (contentType.includes("application/json")) {
								req.body = body ? JSON.parse(body) : {}
							} else if (
								contentType.includes("application/x-www-form-urlencoded")
							) {
								const params: Record<string, string> = {}

								for (const [key, value] of new URLSearchParams(body)) {
									params[key] = value
								}

								req.body = params
							} else {
								req.body = body
							}

							resolve()
						} catch (error) {
							reject(error)
						}
					})

					req.on("error", reject)
				})
			} else {
				req.body = {}
			}

			// log the request when it finishes
			res.on("finish", () => {
				let url = req.url ?? ""

				const elapsedHrTime = process.hrtime(startHrTime)
				const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6

				res._responseTimeMs = elapsedTimeInMs

				if (url.length > 100) {
					url = `${url.substring(0, 100)}...`
				}

				console.log(
					`${req.method} ${
						res._status_code ?? res.statusCode ?? 200
					} ${url} ${elapsedTimeInMs}ms`,
				)
			})

			const route = api.router.lookup(req.url ?? "/") as
				(ApiRoute & { params?: Record<string, string> }) | null

			if (
				!route ||
				!route.handler ||
				route.method.toLowerCase() !== req.method?.toLowerCase()
			) {
				res.statusCode = 404
				res.end(safeStringify({ error: "Not found" }))

				return null
			}

			req.params = route.params ?? {}

			const result = await route.handler(req, res, api.main)

			if (!res.headersSent) {
				if (typeof result !== "undefined") {
					res.statusCode = 200
					res.end(safeStringify(result))
				} else {
					res.statusCode = 204
					res.end()
				}
			}
		} catch (error) {
			console.error(error)

			if (!res.headersSent) {
				res.statusCode = 500
				res.end(
					safeStringify({
						error: error instanceof Error ? error.message : error,
					}),
				)
			}
		}
	}
}
