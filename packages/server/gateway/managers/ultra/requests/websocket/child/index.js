import WebSocket from "ws"
import WebsocketProxy from "../index"

export default class ChildWS {
	constructor(mainSocket, params) {
		this.mainSocket = mainSocket
		this.params = params

		this.target = this.params.target

		if (typeof mainSocket.token === "string") {
			this.target = `${this.target}?token=${encodeURIComponent(mainSocket.token)}`
		}

		// console.log("new ChildWebsocket", {
		// 	params: this.params,
		// })

		this.mainSocket.ws_childrens.set(this.params.serviceId, this)
	}

	retryCount = 0
	abortController = new AbortController()

	buildHandler = (fn) => {
		return async (...args) => {
			try {
				await fn(...args)
			} catch (error) {
				console.error(error)
			}
		}
	}

	connect = () => {
		this.socket = new WebSocket(this.target)

		this.socket.on("open", this.buildHandler(this.onOpen))
		this.socket.on("close", this.buildHandler(this.onClose))
		this.socket.on("error", this.buildHandler(this.onError))
		this.socket.on("message", this.buildHandler(this.onMessage))
	}

	destroy = () => {
		this.abortController.abort()
		this.socket.close()
		this.mainSocket.ws_childrens.delete(this.params.serviceId)
	}

	sendToMain = (data) => {
		if (this.mainSocket.closed || this.closed) {
			return null
		}

		this.mainSocket.send(WebsocketProxy.encode(data))
	}

	sendToChild = (data) => {
		if (this.socket.readyState !== WebSocket.OPEN) {
			return null
		}

		this.socket.send(WebsocketProxy.encode(data))
	}

	retryConn = () => {
		if (this.abortController.signal.aborted || this.mainSocket.closed) {
			return null
		}

		if (this.retryCount >= 3) {
			// close main connection if not closed
			if (!this.mainSocket.closed) {
				this.mainSocket.close()
			}

			return null
		}

		this.retryCount++
		this.mainSocket.ws_childrens.delete(this.params.serviceId)

		console.log(
			`[ultra-ws] retrying connection to ${this.params.serviceId}`,
			{
				retryCount: this.retryCount,
			},
		)

		setTimeout(() => {
			this.connect()
		}, 1000)
	}

	onOpen = () => {
		if (this.abortController.signal.aborted) {
			return null
		}

		this.sendToMain({
			event: "gateway:conn:connected",
			children: this.params.serviceId,
		})

		this.retryCount = 0
	}

	onClose = () => {
		if (this.abortController.signal.aborted) {
			return null
		}

		this.sendToMain({
			event: "gateway:conn:closed",
			service: this.params.serviceId,
		})

		this.retryConn()
	}

	onError = (err) => {
		if (this.abortController.signal.aborted) {
			return null
		}

		this.sendToMain({
			event: "gateway:conn:error",
			service: this.params.serviceId,
			error: err.message,
		})

		this.retryConn()
	}

	onMessage = (data) => {
		if (this.abortController.signal.aborted) {
			return null
		}

		console.log(`[ultra-ws] ${this.params.serviceId} -> main :`, data)
		this.sendToMain(data)
	}
}
