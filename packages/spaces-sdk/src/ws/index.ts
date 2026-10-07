import { WebsocketClient } from "@linebridge/client"

import { BaseStore } from "../classes"
import { adapter } from "../adapter"

interface WebsocketManagerReactiveState {
	connected: boolean
}

export class WebsocketManager extends BaseStore<WebsocketManagerReactiveState> {
	socket: WebsocketClient | null = null

	constructor() {
		super({ connected: false })
	}

	async initialize() {
		console.log("initializing websocket manager", {
			url: adapter.webSocketEndpoint,
		})
		this.socket = new WebsocketClient({
			url: adapter.webSocketEndpoint,
			autoReconnect: true,
			worker: false,
			token: async () => {
				const token = await adapter.sessionGetter?.()

				return token?.token
			},
		})

		this.socket.on("connected", () => {
			this.setState({ connected: true })
		})

		this.socket.on("close", () => {
			this.setState({ connected: false })
		})

		this.socket.on("reconnecting", () => {
			this.setState({ connected: false })
		})

		this.socket.on("reconnected", () => {
			this.setState({ connected: true })
		})

		await this.socket.connect()
	}
}

export const wsManager = new WebsocketManager()

export function useWsManagerStore(): WebsocketManagerReactiveState
export function useWsManagerStore<U>(
	selector: (state: WebsocketManagerReactiveState) => U,
): U
export function useWsManagerStore<U>(
	selector?: (state: WebsocketManagerReactiveState) => U,
) {
	return wsManager.useStore(selector!)
}

export default wsManager
