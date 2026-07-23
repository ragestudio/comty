import { RTCClient } from "@services/rtc/types"
import type MediaChannelsController from ".."

import { MediaChannel, SerializedMediaChannel } from "@classes/MediaChannel"

function DeserializeMaps(state: SerializedMediaChannel) {
	const producersMap = new Map<string, Map<string, any>>()
	const consumersMap = new Map<string, any[]>()

	if (state.producers) {
		for (const [userId, userProducers] of Object.entries(state.producers)) {
			const innerMap = new Map<string, any>()
			for (const [producerId, producerData] of Object.entries(
				userProducers,
			)) {
				innerMap.set(producerId, producerData)
			}
			producersMap.set(userId, innerMap)
		}
	}

	if (state.consumers) {
		for (const [consumerId, consumers] of Object.entries(state.consumers)) {
			consumersMap.set(consumerId, consumers)
		}
	}

	return { producers: producersMap, consumers: consumersMap }
}

export default async function (
	this: MediaChannelsController,
	channelId: string,
	bindClient?: RTCClient,
) {
	const instance = this.instances.get(channelId)

	if (instance) {
		return instance
	}

	// if instance not found, try to reconstruct from state
	try {
		const state = (await this.mediaChannelsStateBucket.get(
			channelId,
		)) as SerializedMediaChannel | null

		// if state is null or closed, is safe to return null
		// the rest of the code will handle the null case
		if (!state || state.closed) return null

		const sfu_node = this.sfuDiscovery.nodes.find(
			(n) => n.node_id.toString() === state.sfu_node_id,
		)

		// if state is available, but sfu_node is not found, is needed to throw an error
		if (!sfu_node) {
			throw new Error(
				`Failed to find SFU node for channel [${channelId}]`,
			)
		}

		const router = await sfu_node.getRouter(state.router_id)

		// if router is not found, throw an error
		if (!router) {
			throw new Error(`Failed to get router for channel [${channelId}]`)
		}

		console.log(
			`Restoring channel instance for channel [${channelId}]`,
			state,
		)

		// TODO: Check the ownership controller of the channel.
		// If the channel is not owned by this controller, try to ask to the controller owner.
		// If the controller owner does not have the channel, take the ownership.
		// If the controller owner has the channel, start synchronization with the controller owner.
		const restoredInstance = new MediaChannel(
			{
				data: state.data,
				channelId: state.channel_id,
				mediaCodecs: state.mediaCodecs,
			},
			this,
			sfu_node,
			router,
		)

		restoredInstance.sfu_node = sfu_node
		restoredInstance.router = router
		restoredInstance.started_at = new Date(state.started_at)
		// @ts-ignore
		restoredInstance.clients = new Set(
			state.clients.map((client) => {
				if (bindClient && client.userId === bindClient.userId) {
					return bindClient
				}

				const staleClient: Partial<RTCClient> = {
					staled: true,
					userId: client.userId,
					channel_id: state.channel_id,
					voiceState: client.voiceState,
					//@ts-ignore
					voice_state: client.voiceState,
				}

				// @ts-ignore
				staleClient.socket.context.user = client.user
				// @ts-ignore
				staleClient.context.user = client.user

				return staleClient
			}),
		)

		const { producers, consumers } = DeserializeMaps(state)
		restoredInstance.producers = producers
		restoredInstance.consumers = consumers

		console.log(
			"Restored channel instance from state bucket",
			restoredInstance,
		)

		//await restoredInstance.initialize()

		// add to local map memory
		this.instances.set(channelId, restoredInstance)

		return restoredInstance
	} catch (e) {
		console.error("Failed to reconstruct channel instance", e)
		return null
	}
}
