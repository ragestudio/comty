import setFind from "@shared-utils/setFind"
import type { RTCClient } from "../types.d.ts"

export type LeaveClientOptions = {
	emitEventToSelf?: boolean
}

async function leaveClientHandler(
	this: any,
	client: RTCClient,
	{ emitEventToSelf = false }: LeaveClientOptions = {},
) {
	try {
		const clientInst = setFind(this.clients, (c: RTCClient) => {
			return c.userId === client.userId
		})

		if (!clientInst) {
			return null
		}

		this.clients.delete(clientInst)

		const clientProducers = this.producers.get(client.userId)

		const otherClients = Array.from(this.clients).filter(
			(c: RTCClient) => c.userId !== client.userId,
		)

		if (clientProducers instanceof Map) {
			for (const [id, producerInst] of clientProducers) {
				if (
					producerInst &&
					producerInst.producer &&
					!producerInst.producer.closed
				) {
					producerInst.producer.close()
					// Ensure cleanup is called
					await producerInst.onProducerClose()
					clientProducers.delete(id)
				}
			}

			this.producers.delete(client.userId)
		}

		// Cleanup consumers
		const clientConsumers = this.consumers.get(client.userId)

		if (Array.isArray(clientConsumers)) {
			for (const consumer of clientConsumers) {
				if (consumer && !consumer.closed) {
					consumer.close()
				}
			}

			this.consumers.delete(client.userId)
		}

		// Cleanup transports
		if (clientInst.transports) {
			for (const [, transport] of clientInst.transports) {
				if (!transport.closed) {
					transport.close()
				}
			}

			clientInst.transports.clear()
		}

		// Notify other clients about client leaving
		for (const otherClient of otherClients) {
			await (otherClient as RTCClient).emit(`media:channel:client:left`, {
				userId: client.userId,
				channelId: this.channelId,
			})
		}

		// publish to group topic
		this.events.emit("client:leave", this, clientInst)

		// await this.sendToGroupTopic("client:vc:left", {
		// 	userId: clientInst.userId,
		// 	channelId: this.channelId,
		// 	channelClients: this.getConnectedClientsSerialized(),
		// })

		if (emitEventToSelf === true) {
			// notify the client that they left the channel
			await clientInst.emit(`media:channel:disconnected`, {
				channelId: this.channelId,
			})
		}

		console.log(
			`[CHANNEL:${this.channelId}] Client ${client.userId} left channel`,
		)

		// if no users left, close it self
		if (this.clients.size === 0) {
			this.close()
		}

		return {
			userId: client.userId,
			channelId: this.channelId,
		}
	} catch (error) {
		console.error(`[CHANNEL:${this.channelId}] Error leaving client`, error)
	}
}

export default leaveClientHandler
