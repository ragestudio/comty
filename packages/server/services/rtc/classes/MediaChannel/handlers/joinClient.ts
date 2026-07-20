import type { RTCClient } from "@services/rtc/types"

export type JoinClientOptions = {
	isReconnection?: boolean
}

export default async function (
	this: any,
	client: RTCClient,
	options: JoinClientOptions = {},
) {
	try {
		client.transports = new Map()

		client.voiceState = {
			muted: false,
			deafen: false,
		}

		client.channel_id = this.channelId

		// add to set of clients
		this.clients.add(client)

		const clients = Array.from(this.clients) as RTCClient[]

		// only notify other clients if this is NOT a reconnection
		if (!options.isReconnection) {
			const otherClients = clients.filter(
				(c) => c.userId !== client.userId,
			)

			for (const otherClient of otherClients) {
				await otherClient.emit(`media:channel:client:joined`, {
					userId: client.userId,
					user: client.context.user,
					voiceState: client.voiceState,
				})
			}

			// publish to group topic only for new joins
			this.events.emit("client:join", this, client)
		}

		const producers = []

		for (const c of clients) {
			if (c.userId === client.userId) {
				continue
			}

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

		return {
			started_at: this.started_at,
			room: this.data,
			channelId: this.channelId,
			rtpCapabilities: this.router.rtpCapabilities,
			clients: clients.map((_client) => {
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
