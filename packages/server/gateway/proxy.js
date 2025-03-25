import httpProxy from "http-proxy"
import defaults from "linebridge/dist/defaults"

import pkg from "../package.json"

import http from "node:http"
import https from "node:https"

import fs from "node:fs"
import path from "node:path"

function getHttpServerEngine(extraOptions = {}, handler = () => {}) {
	const sslKey = path.resolve(process.cwd(), ".ssl", "privkey.pem")
	const sslCert = path.resolve(process.cwd(), ".ssl", "cert.pem")

	if (fs.existsSync(sslKey) && fs.existsSync(sslCert)) {
		return https.createServer(
			{
				key: fs.readFileSync(sslKey),
				cert: fs.readFileSync(sslCert),
				...extraOptions,
			},
			handler,
		)
	} else {
		return http.createServer(extraOptions, handler)
	}
}

export default class Proxy {
	constructor() {
		this.proxys = new Map()
		this.wsProxys = new Map()

		this.http = getHttpServerEngine({}, this.handleHttpRequest)
		this.http.on("upgrade", this.handleHttpUpgrade)
	}

	http = null

	register = ({ serviceId, path, target, pathRewrite, ws } = {}) => {
		if (!path) {
			throw new Error("Path is required")
		}

		if (!target) {
			throw new Error("Target is required")
		}

		if (this.proxys.has(path)) {
			console.warn(`Proxy already registered [${path}], skipping...`)
			return false
		}

		const proxy = httpProxy.createProxyServer({
			target: target,
		})

		proxy.on("proxyReq", (proxyReq, req, res, options) => {
			proxyReq.setHeader("x-linebridge-version", pkg.version)
			proxyReq.setHeader("x-forwarded-for", req.socket.remoteAddress)
		})

		proxy.on("error", (e) => {
			console.error(e)
		})

		const proxyObj = {
			serviceId: serviceId ?? "default_service",
			path: path,
			target: target,
			pathRewrite: pathRewrite,
			proxy: proxy,
		}

		if (ws) {
			console.log(
				`🔗 Registering websocket proxy [${path}] -> [${target}]`,
			)
			this.wsProxys.set(path, proxyObj)
		} else {
			console.log(`🔗 Registering path proxy [${path}] -> [${target}]`)
			this.proxys.set(path, proxyObj)
		}

		return true
	}

	unregister = (path) => {
		if (!this.proxys.has(path)) {
			console.warn(`Proxy not registered [${path}], skipping...`)
			return false
		}

		console.log(`🔗 Unregistering path proxy [${path}]`)

		this.proxys.get(path).proxy.close()
		this.proxys.delete(path)
	}

	unregisterAllFromService = (serviceId) => {
		this.proxys.forEach((value, key) => {
			if (value.serviceId === serviceId) {
				this.unregister(value.path)
			}
		})
	}

	listen = async (port = 9000, host = "0.0.0.0", cb) => {
		return await new Promise((resolve, reject) => {
			this.http.listen(port, host, () => {
				console.log(`🔗 Proxy listening on ${host}:${port}`)

				if (cb) {
					cb(this)
				}

				resolve(this)
			})
		})
	}

	rewritePath = (rewriteConfig, path) => {
		let result = path
		const rules = []

		for (const [key, value] of Object.entries(rewriteConfig)) {
			rules.push({
				regex: new RegExp(key),
				value: value,
			})
		}

		for (const rule of rules) {
			if (rule.regex.test(path)) {
				result = result.replace(rule.regex, rule.value)
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

	handleHttpRequest = (req, res) => {
		res = this.setCorsHeaders(res)

		const sanitizedUrl = req.url.split("?")[0]

		// preflight continue with code 204
		if (req.method === "OPTIONS") {
			res.statusCode = 204
			res.end()
			return
		}

		if (sanitizedUrl === "/") {
			return res.end(
				JSON.stringify({
					name: pkg.name,
					version: pkg.version,
					lb_version: defaults.version,
				}),
			)
		}

		const namespace = `/${sanitizedUrl.split("/")[1]}`
		const route = this.proxys.get(namespace)

		if (!route) {
			res.statusCode = 404

			res.end(
				JSON.stringify({
					error: "Gateway route not found",
					details:
						"The gateway route you are trying to access does not exist, maybe the service is down...",
					namespace: namespace,
				}),
			)

			return null
		}

		if (route.pathRewrite) {
			req.url = this.rewritePath(route.pathRewrite, req.url)
		}

		route.proxy.web(req, res)
	}

	handleHttpUpgrade = (req, socket, head) => {
		const namespace = `/${req.url.split("/")[1].split("?")[0]}`
		const route = this.wsProxys.get(namespace)

		if (!route) {
			// destroy socket
			socket.destroy()
			return false
		}

		if (route.pathRewrite) {
			req.url = this.rewritePath(route.pathRewrite, req.url)
		}

		route.proxy.ws(req, socket, head)
	}

	close = () => {
		this.http.close()
	}
}
