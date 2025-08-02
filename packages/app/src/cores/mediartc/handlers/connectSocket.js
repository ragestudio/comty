import { RTEngineClient } from "linebridge/client/src/rtengine"
import SessionModel from "@models/session"

import buildWebsocketHandler from "../utils/buildWebsocketHandler"

export default async function ({ registerEvents } = {}) {
	try {
		this.state.status = "connecting"

		this.console.debug(
			"connecting to rtc websocket",
			this.constructor.wsUrl,
		)

		this.socket = new RTEngineClient({
			url: this.constructor.wsUrl,
			token: SessionModel.token,
			maxConnectRetries: 0,
		})

		await this.socket.connect()

		// register events
		for (const event of Object.keys(registerEvents)) {
			this.socket.on(
				event,
				buildWebsocketHandler(this, registerEvents[event]),
			)
		}

		this.state.status = "connected"
	} catch (error) {
		this.console.error("Error connecting ws:", error)
		this.state.status = "failed"
	}
}
