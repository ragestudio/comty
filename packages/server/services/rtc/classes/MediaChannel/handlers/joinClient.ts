import type { RTCClient } from "@services/rtc/types"

export default async function (this: any, client: RTCClient) {
	try {
		client.transports = new Map()

		client.voiceState = {
			muted: false,
			deafened: false,
		}

		client.channel_id = this.channelId

		// add to set of clients
		this.clients.add(client)

		const clients = Array.from(this.clients)

		// Notify other clients about new client
		const otherClients = clients.filter(
			(c: RTCClient) => c.userId !== client.userId,
		) as RTCClient[]

		for (const otherClient of otherClients) {
			await otherClient.emit(`media:channel:client:joined`, {
				userId: client.userId,
				user: client.context.user,
				voiceState: client.voiceState,
			})
		}

		const producers = []

		for (const c of otherClients) {
			let userProducers = this.producers.get(c.userId)

			if (userProducers instanceof Map) {
				for (const [id, producer] of userProducers) {
					if (producer.closed) {
						continue
					}

					producers.push(producer.serialize())
				}
			}
		}

		// publish to group topic
		this.events.emit("client:join", this, client)

		return {
			started_at: this.started_at,
			room: this.data,
			channelId: this.channelId,
			rtpCapabilities: this.router.rtpCapabilities,
			clients: clients.map((_client: RTCClient) => {
				const data = {
					userId: _client.userId,
					voiceState: _client.voiceState,
				} as RTCClient

				if (_client.userId === client.userId) {
					data.self = true
				}

				return data
			}),
			producers: producers,
		}
	} catch (error) {
		console.error(
			`[CHANNEL:${this.channelId}] Error joining client ${client.userId}:`,
			error,
		)
		throw error
	}
}
