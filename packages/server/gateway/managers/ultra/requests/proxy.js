import http from "http"
import https from "https"

export default async function (req, res) {
	let proxyReq = null
	let registry = null

	try {
		// extract namespace from path
		// eg. /users/123/data -> /users
		const namespace = req.path.split("/")[1]

		registry = this.targets.get(namespace)

		if (!registry) {
			res.status(404).json({
				error: "Endpoint not found for this service",
				namespace: namespace,
			})

			return
		}

		const options = {
			method: req.method,
			path: req.url,
			query: req.query,

			hostname: registry.url.hostname,
			port: registry.url.port,
			headers: req.headers,
		}

		proxyReq = registry.secure
			? https.request(options)
			: http.request(options)

		proxyReq.on("response", (proxyRes) => {
			if (!res.headersSent) {
				for (const [key, value] of Object.entries(proxyRes.headers)) {
					res.setHeader(key, value)
				}

				res.status(proxyRes.statusCode)
			}

			if (!res.finished) {
				proxyRes.pipe(res)
			}
		})

		proxyReq.on("error", (err) => {
			this.console.error(err, registry.url)

			if (!res.headersSent) {
				res.status(502).json({
					error: "Gateway error",
					message: err.message,
					service_id: registry.serviceId,
					target: registry.target,
				})
			}
		})

		// handle aborts
		proxyReq.on("aborted", () => {
			if (!res.headersSent) {
				res.end()
			}
		})

		req.on("aborted", () => {
			proxyReq.destroy()
		})

		// Proxy the request
		await req.pipe(proxyReq)

		if (req.receivedData) {
			proxyReq.end()
		}
	} catch (error) {
		this.console.error("Proxy internal error:", error)

		if (!res.headersSent) {
			res.status(502).json({
				error: "Gateway error",
				message: error.message,
				service_id: registry.serviceId,
				target: registry.target,
			})
		}
	}
}
