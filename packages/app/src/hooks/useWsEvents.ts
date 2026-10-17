import React from "react"

import client from "comty.js/core/client"

export default (
	wsEvents: any,
	{ socketName }: { socketName?: string } = {},
) => {
	function registerEvents() {
		const socket = client.ws.get(socketName ?? "main")

		if (!socket) return

		for (const [eventName, eventHandler] of Object.entries(
			wsEvents as Record<string, any>,
		)) {
			socket.on(eventName, eventHandler)
		}
	}

	function unregisterEvents() {
		const socket = client.ws.get(socketName ?? "main")

		if (!socket) return

		for (const [eventName, eventHandler] of Object.entries(
			wsEvents as Record<string, any>,
		)) {
			socket.off(eventName, eventHandler)
		}
	}

	React.useEffect(() => {
		if (typeof wsEvents === "function") {
			wsEvents = [wsEvents]
		}

		registerEvents()

		return () => {
			unregisterEvents()
		}
	}, [])

	return wsEvents
}
