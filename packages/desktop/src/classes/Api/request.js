// Helper function to safely stringify JSON and avoid circular references
const safeStringify = (obj) => {
	const seen = new WeakSet()

	return JSON.stringify(obj, (key, val) => {
		if (val != null && typeof val === "object") {
			if (seen.has(val)) {
				return "[Circular]"
			}

			seen.add(val)
		}
		return val
	})
}

export default async function (req, res) {
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

		// set content type as JSON by default
		res.setHeader("Content-Type", "application/json")

		// Parse request body for POST, PUT, PATCH methods
		if (
			req.method === "POST" ||
			req.method === "PUT" ||
			req.method === "PATCH"
		) {
			await new Promise((resolve, reject) => {
				let body = ""

				req.on("data", (chunk) => {
					body += chunk.toString()
				})

				req.on("end", () => {
					try {
						const contentType = req.headers["content-type"] || ""

						if (contentType.includes("application/json")) {
							req.body = body ? JSON.parse(body) : {}
						} else if (
							contentType.includes(
								"application/x-www-form-urlencoded",
							)
						) {
							req.body = {}

							if (body) {
								const params = new URLSearchParams(body)
								for (const [key, value] of params) {
									req.body[key] = value
								}
							}
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
			let url = req.url

			const elapsedHrTime = process.hrtime(startHrTime)
			const elapsedTimeInMs =
				elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6

			res._responseTimeMs = elapsedTimeInMs

			if (url.length > 100) {
				url = url.substring(0, 100) + "..."
			}

			console.log(
				`${req.method} ${res._status_code ?? res.statusCode ?? 200} ${url} ${elapsedTimeInMs}ms`,
			)
		})

		const route = this.router.lookup(req.url)

		if (!route || !route.handler) {
			res.statusCode = 404
			res.end(safeStringify({ error: "Not found" }))

			return null
		}

		if (route.method.toLowerCase() !== req.method.toLowerCase()) {
			res.statusCode = 404
			res.end(safeStringify({ error: "Not found" }))

			return null
		}

		req.params = route.params

		const result = await route.handler(req, res, this.main)

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
					error: error.message,
				}),
			)
		}
	}
}
