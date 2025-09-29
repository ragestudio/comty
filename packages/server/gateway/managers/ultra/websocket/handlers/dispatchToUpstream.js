import { Empty } from "nats"
import synthesizeClient from "./synthesizeClient"

export default async function ({ ws, serviceId, event, data = Empty }) {
	let abort = false

	const { headers: upstreamHeaders } = synthesizeClient(ws)

	// add the event header
	upstreamHeaders.append("event", event)

	if (!Array.isArray(serviceId)) {
		serviceId = [serviceId]
	}

	if (data && !(data instanceof Uint8Array)) {
		try {
			data = this.codec.encode(data)
		} catch {
			console.error(`Failed to encode data for upstream service ${id}`)
			abort = true
		}
	}

	if (abort === true) {
		return null
	}

	for (const id of serviceId) {
		try {
			await this.jetstream.publish(`upstream.${id}`, data ?? Empty, {
				headers: upstreamHeaders,
			})
		} catch {
			console.error(`Failed to publish to upstream service ${id}`)
		}
	}
}
