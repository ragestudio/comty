import client from "comty.js/core/client"

import baseWsEvents from "./baseWsEvents"

const WS_EVENTS = [
	"open",
	"close",
	"connected",
	"reconnecting",
	"reconnected",
	"reconnection_failed",
	"error",
]

let initialized = false
let mainSocketReconnecting = false

export function initRealtime() {
	if (initialized) return

	initialized = true

	for (const namespace of client.ws.namespaces) {
		for (const event of WS_EVENTS) {
			const name = `wsmanager:${namespace}:${event}`

			client.eventBus.on(name, (data) => app.eventBus.emit(name, data))
		}
	}

	app.eventBus.on("wsmanager:main:open", () => {
		const socket = client.ws.get("main")

		if (!socket) return

		for (const [event, handler] of Object.entries(baseWsEvents)) {
			socket.on(event, handler as any)
		}
	})

	app.eventBus.on("wsmanager:main:reconnecting", () => {
		app.cores.notifications.new({
			key: "main-socket-reconnect",
			type: "loading",
			title: "Reconnecting to socket",
			feedback: false,
			description:
				"Something fails with the connection, we are trying to reconnect.\n Some features may not work!",
			duration: 0,
		})

		mainSocketReconnecting = true
	})

	app.eventBus.on("wsmanager:main:reconnected", () => {
		if (!mainSocketReconnecting) return

		mainSocketReconnecting = false

		app.cores.notifications.close("main-socket-reconnect")
		app.cores.notifications.new({
			key: "main-socket-reconnect",
			type: "success",
			title: "Reconnected to socket",
		})
	})
}

export default initRealtime
