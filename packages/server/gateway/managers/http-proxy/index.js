import httpProxy from "http-proxy"
import defaults from "linebridge/dist/defaults"
import pkg from "../../../package.json" // Ajustado la ruta para que coincida con tu estructura

import http from "node:http"
import https from "node:https"
import fs from "node:fs"
import path from "node:path"

function getHttpServerEngine(extraOptions = {}, handler = () => {}) {
	const sslKey = path.resolve(process.cwd(), ".ssl", "privkey.pem")
	const sslCert = path.resolve(process.cwd(), ".ssl", "cert.pem")

	if (fs.existsSync(sslKey) && fs.existsSync(sslCert)) {
		console.log("Using HTTPS server")
		return https.createServer(
			{
				key: fs.readFileSync(sslKey),
				cert: fs.readFileSync(sslCert),
				...extraOptions,
			},
			handler,
		)
	} else {
		console.log("Using HTTP server")
		return http.createServer(extraOptions, handler)
	}
}

export default class Proxy {
	constructor(config = {}) {
		this.routes = new Map()
		this.config = config

		// Crear servidor HTTP
		this.server = getHttpServerEngine({}, this.handleRequest.bind(this))

		// Manejar upgrades de WebSocket
		this.server.on("upgrade", this.handleUpgrade.bind(this))

		// Crear una única instancia de proxy que se reutilizará
		this.proxyServer = httpProxy.createProxyServer({
			changeOrigin: true,
			xfwd: true,
		})

		// Manejar errores del proxy
		this.proxyServer.on("error", (err, req, res) => {
			console.error("Proxy error:", err)
			if (res && !res.headersSent) {
				res.writeHead(502, { "Content-Type": "application/json" })
				res.end(
					JSON.stringify({
						error: "Bad Gateway",
						message: err.message,
					}),
				)
			}
		})
	}

	register = ({ serviceId, path, target, pathRewrite, websocket } = {}) => {
		if (!path || !target) {
			throw new Error("Path and target are required")
		}

		if (this.routes.has(path)) {
			console.warn(`Route already registered [${path}], skipping...`)
			return false
		}

		const routeObj = {
			serviceId: serviceId ?? "default_service",
			path,
			target,
			pathRewrite,
			isWebSocket: !!websocket,
		}

		console.log(
			`🔗 Registering ${websocket ? "websocket" : "http"} route [${path}] -> [${target}]`,
		)
		this.routes.set(path, routeObj)
		return true
	}

	unregister = (path) => {
		if (!this.routes.has(path)) {
			console.warn(`Route not registered [${path}], skipping...`)
			return false
		}

		console.log(`🔗 Unregistering route [${path}]`)
		this.routes.delete(path)
		return true
	}

	unregisterAllFromService = (serviceId) => {
		const pathsToRemove = []

		this.routes.forEach((route, path) => {
			if (route.serviceId === serviceId) {
				pathsToRemove.push(path)
			}
		})

		pathsToRemove.forEach(this.unregister)
	}

	initialize = async () => {
		// No es necesario inicializar nada, el servidor ya está configurado
		return true
	}

	start = async () => {
		return new Promise((resolve, reject) => {
			this.server.listen(
				this.config.port,
				this.config.internalIp,
				(err) => {
					if (err) {
						console.error("Failed to start server:", err)
						return reject(err)
					}
					console.log(`🚀 Server listening on ${host}:${port}`)
					resolve()
				},
			)
		})
	}

	stop = async () => {
		return new Promise((resolve) => {
			this.server.close(() => {
				console.log("Server stopped")
				this.proxyServer.close()
				resolve()
			})
		})
	}

	applyConfiguration = async () => {
		// No se necesita aplicar configuración específica
		return true
	}

	reload = async () => {
		// No es necesario recargar nada
		return true
	}

	rewritePath = (rewriteConfig, path) => {
		let result = path

		if (!rewriteConfig) return result

		for (const [pattern, replacement] of Object.entries(rewriteConfig)) {
			const regex = new RegExp(pattern)
			if (regex.test(path)) {
				result = result.replace(regex, replacement)
				break
			}
		}

		return result
	}

	setCorsHeaders = (res) => {
		res.setHeader("Access-Control-Allow-Origin", "*")
		res.setHeader(
			"Access-Control-Allow-Methods",
			"GET,HEAD,PUT,PATCH,POST,DELETE",
		)
		res.setHeader("Access-Control-Allow-Headers", "*")
		return res
	}

	findRouteForPath(url) {
		const urlPath = url.split("?")[0]
		const segments = urlPath.split("/").filter(Boolean)

		if (segments.length === 0) return null

		const namespace = `/${segments[0]}`
		return this.routes.get(namespace)
	}

	handleRequest = (req, res) => {
		this.setCorsHeaders(res)

		// Si es una solicitud OPTIONS, responder inmediatamente
		if (req.method === "OPTIONS") {
			res.statusCode = 204
			res.end()
			return
		}

		// Responder a solicitudes raíz
		if (req.url === "/") {
			res.setHeader("Content-Type", "application/json")
			res.end(
				JSON.stringify({
					name: pkg.name,
					version: pkg.version,
					lb_version: defaults?.version || "unknown",
				}),
			)
			return
		}

		// Encontrar la ruta para esta solicitud
		const route = this.findRouteForPath(req.url)

		if (!route) {
			res.statusCode = 404
			res.setHeader("Content-Type", "application/json")
			res.end(
				JSON.stringify({
					error: "Gateway route not found",
					details:
						"The requested route does not exist or the service is down",
					path: req.url,
				}),
			)
			return
		}

		// Preparar opciones de proxy
		const proxyOptions = {
			target: route.target,
			changeOrigin: true,
			xfwd: true,
		}

		// save original url
		req.originalUrl = req.url

		// Aplicar reescritura de ruta si está configurada
		if (route.pathRewrite) {
			req.url = this.rewritePath(route.pathRewrite, req.url)
		} else {
			req.url = this.rewritePath({ [`^${route.path}`]: "" }, req.url)
		}

		// Agregar encabezados personalizados
		this.proxyServer.on("proxyReq", (proxyReq, req, res, options) => {
			proxyReq.setHeader("x-linebridge-version", pkg.version)
			proxyReq.setHeader(
				"x-forwarded-for",
				req.socket.remoteAddress || req.ip,
			)
			proxyReq.setHeader("x-service-id", route.serviceId)
			proxyReq.setHeader(
				"X-Forwarded-Proto",
				req.socket.encrypted ? "https" : "http",
			)
		})

		// Proxy la solicitud
		this.proxyServer.web(req, res, proxyOptions, (err) => {
			if (err) {
				console.error("Proxy error:", err)
				if (!res.headersSent) {
					res.statusCode = 502
					res.setHeader("Content-Type", "application/json")
					res.end(
						JSON.stringify({
							error: "Bad Gateway",
							message: err.message,
						}),
					)
				}
			}
		})
	}

	handleUpgrade = (req, socket, head) => {
		// Encontrar la ruta para esta conexión WebSocket
		const route = this.findRouteForPath(req.url)

		if (!route) {
			console.error(`WebSocket route not found for ${req.url}`)
			socket.write("HTTP/1.1 404 Not Found\r\n\r\n")
			socket.destroy()
			return
		}

		// save original url
		req.originalUrl = req.url

		// Aplicar reescritura de ruta si está configurada
		if (route.pathRewrite) {
			req.url = this.rewritePath(route.pathRewrite, req.url)
		} else {
			req.url = this.rewritePath({ [`^${route.path}`]: "" }, req.url)
		}

		// Crear un objeto de opciones de proxy específico para WebSocket
		const wsProxyOptions = {
			target: route.target,
			ws: true,
			changeOrigin: true,
		}

		// Proxy la conexión WebSocket
		this.proxyServer.ws(req, socket, head, wsProxyOptions, (err) => {
			if (err) {
				console.error("WebSocket proxy error:", err)
				socket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n")
				socket.destroy()
			}
		})
	}
}
