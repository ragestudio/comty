import type { RTCClient } from "../types.d.ts"

async function joinClientHandler(this: any, client: RTCClient) {
	try {
		client.transports = new Map()

		client.voiceState = {
			muted: false,
			deafened: false,
		}

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
		await this.sendToGroupTopic("client:vc:join", {
			userId: client.userId,
			channelId: this.channelId,
			user: {
				_id: client.context.user._id,
				username: client.context.user.username,
				avatar: client.context.user.avatar,
			},
			voiceState: client.voiceState,
			channelClients: this.getConnectedClientsSerialized(),
		})

		return {
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
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}

export default joinClientHandler
