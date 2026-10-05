import type { Transports } from "."
import type { SerializedCreateTransport } from "@comty/shared/types/rtc/handlers/createTransport"
import type { SerializedConnectTransport } from "@comty/shared/types/rtc/handlers/connectTransport"
import type { RTC_ProducePayload } from "@comty/shared/types/rtc/events/inbound"
import type {
	Transport,
	TransportEvents,
	TransportObserverEvents,
	TransportOptions as _TransportOptions,
} from "mediasoup-client/types"

export type EventHandlers<TEvents, TContext> = {
	[K in keyof TEvents]: (
		this: TContext,
		transport: Transport,
		...args: TEvents[K] extends any[] ? TEvents[K] : never
	) => void
}

export type CommonTransportEvents = Pick<
	TransportEvents,
	"connect" | "connectionstatechange" | "produce"
> &
	Pick<TransportObserverEvents, "close">

export const CommonTransportHandlers: EventHandlers<
	CommonTransportEvents,
	Transports
> = {
	async connect(transport, { dtlsParameters }, callback, errback) {
		if (!this.core.socket) {
			throw new Error("Cannot connect transport without socket")
		}

		try {
			const payload: SerializedConnectTransport = {
				isDm: false,
				transportId: transport.id,
				dtlsParameters,
			}

			await this.core.socket.call("channel:connect_transport", payload)

			callback()
		} catch (error: unknown) {
			console.error("Transport connection failed:", error)
			errback(error as Error)
		}
	},

	connectionstatechange(transport, state) {
		console.debug(
			`[webrtc] Transport (${transport.direction})[${transport.id}] state changed: ${state}`,
		)

		if (state === "failed") this.core._handleTransportFailure()
	},

	async close(transport) {
		console.debug(
			`[webrtc] Transport (${transport.direction})[${transport.id}] closed`,
		)

		if (!this.core.socket) return
		//await this.core.socket.call("channel:disconnect_transport", { transportId: transport.id })
	},

	async produce(
		transport,
		{ kind, rtpParameters, appData },
		callback,
		errback,
	) {
		if (!this.core.socket) {
			throw new Error("Cannot produce transport without socket")
		}

		try {
			const payload: RTC_ProducePayload = {
				isDm: false,
				transportId: transport.id,
				kind: kind,
				rtpParameters: rtpParameters,
				appData: appData,
			}

			const result = await this.core.socket.call(
				"channel:produce",
				payload,
			)

			callback({ id: result.id })
		} catch (error: any) {
			console.error("Producer creation failed:", error)
			errback(error)
		}
	},
}

// interface TransportOptions extends Omit<
// 	_TransportOptions,
// 	"additionalSettings"
// > {
// 	additionalSettings: {
// 		encodedInsertableStreams: boolean
// 	} & _TransportOptions["additionalSettings"]
// }

export async function create(this: Transports, direction: "send" | "recv") {
	if (!this.core.device) return null
	if (!this.core.socket) return null

	if (direction !== "send" && direction !== "recv") {
		throw new Error(`Invalid transport direction: ${direction}`)
	}

	console.debug(`[webrtc] Creating (${direction}) new transport`)

	const transportData =
		await this.core.socket.call<SerializedCreateTransport>(
			"channel:create_transport",
			{ isDm: false }, // <-- not needed but included anyways for compat
		)

	let transport: Transport

	switch (direction) {
		case "send":
			transport = this.core.device.createSendTransport(transportData)
			break
		case "recv":
			transport = this.core.device.createRecvTransport(transportData)
			break
	}

	transport.on("connectionstatechange", (...args) =>
		CommonTransportHandlers.connectionstatechange.call(
			this,
			transport,
			...args,
		),
	)
	transport.on("connect", (...args) =>
		CommonTransportHandlers.connect.call(this, transport, ...args),
	)
	transport.observer.on("close", (...args) =>
		CommonTransportHandlers.close.call(this, transport, ...args),
	)
	transport.on("produce", (...args) =>
		CommonTransportHandlers.produce.call(this, transport, ...args),
	)

	return transport
}

export default create
