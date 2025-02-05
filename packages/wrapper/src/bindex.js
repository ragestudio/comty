import path from "node:path"
import fs from "node:fs"
import HyperExpress from "hyper-express"
import LiveDirectory from "live-directory"

const { WebSocket: WSClient } = require("ws")
const http = require("http")

// CONFIGURATION CONSTANTS
const publicPath = path.resolve(process.cwd(), "public")
const TARGET_HTTP = "http://localhost:9000"
const TARGET_WS = "ws://localhost:8080"
const LISTENT_PORT = 9999

async function main() {
	if (!fs.existsSync(publicPath)) {
		console.log("Public path does not exist, creating...")
		fs.mkdirSync(publicPath)
	}

	const app = new HyperExpress.Server()
	const liveDirectory = new LiveDirectory(publicPath)

	app.any("/*", async (req, res) => {
		if (req.url.startsWith("/api")) {
			return handleApiProxyRequest(req, res)
		}

		return handleStaticFileRequest(liveDirectory, req, res)
	})

	await app.listen(LISTENT_PORT)

	console.log(`LISTENING on port ${LISTENT_PORT}`)
}

async function handleStaticFileRequest(liveDirectory, req, res) {
	let file = liveDirectory.get(req.path)

	if (file === undefined) {
		file = liveDirectory.get("index.html")
	}

	if (file === undefined) {
		return res.status(404).json({ error: "Not found" })
	}

	const fileParts = file.path.split(".")
	const extension = fileParts[fileParts.length - 1]

	// Retrieve the file content and serve it depending on the type of content available for this file
	const content = file.content

	if (content instanceof Buffer) {
		// Set appropriate mime-type and serve file content Buffer as response body (This means that the file content was cached in memory)
		return res.type(extension).send(content)
	} else {
		// Set the type and stream the content as the response body (This means that the file content was NOT cached in memory)
		return res.type(extension).stream(content)
	}
}

async function handleApiProxyRequest(request, response) {
	try {
		const targetURL = new URL(request.url, TARGET_HTTP)
		const headers = { ...request.headers, host: targetURL.host }

		// Configurar la solicitud al servidor de destino
		const proxyReq = http.request({
			hostname: targetURL.hostname,
			port: targetURL.port || 80,
			path: targetURL.pathname + targetURL.search,
			method: request.method,
			headers,
		})

		// Manejar la respuesta del servidor de destino
		proxyReq.on("response", (proxyRes) => {
			response.status(proxyRes.statusCode)

			// Copiar headers
			Object.entries(proxyRes.headers).forEach(([key, val]) => {
				response.header(key, val)
			})

			// Pipe de la respuesta
			proxyRes.pipe(response.stream)
		})

		// Manejar errores
		proxyReq.on("error", (error) => {
			response.status(500).send(`Proxy error: ${error.message}`)
		})

		// Pipe del cuerpo de la solicitud
		request.stream().pipe(proxyReq)
	} catch (error) {
		console.error(error)
		response.status(500).send("Internal Server Error")
	}
}

main()
