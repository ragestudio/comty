import type MediaChannelsController from "."
import type MediaChannel from "@classes/MediaChannel"
import type { RTCClient } from "@services/rtc/types"

// the owner answered that it no longer serves the channel
function isChannelMovedError(error: any): boolean {
	if (!error || Number(error.code) !== 409) return false

	const message = String(error.message ?? "")

	return (
		message.includes("Channel moved to another node") ||
		message.includes("Channel is not owned by this node")
	)
}

/**
 * Proxy for a voice channel served by another node.
 *
 * Every method is forwarded to the controller that owns the channel, so the
 * media session keeps a single source of truth regardless of where the
 * client socket landed.
 */
export class RemoteMediaChannel {
	controller: MediaChannelsController
	channelId: string
	nodeId: string

	readonly is_remote = true
	readonly closed = false
	started_at?: Date

	sfu_node: {
		requestKeyframe: (payload: any) => Promise<any>
	}

	constructor(
		controller: MediaChannelsController,
		channelId: string,
		nodeId: string,
	) {
		this.controller = controller
		this.channelId = channelId
		this.nodeId = nodeId

		// keyframes go to the shared sfu node, the method lives there
		this.sfu_node = {
			requestKeyframe: (payload: any) =>
				this.call("requestKeyframe", [payload]),
		}
	}

	private async call(
		method: string,
		args: any[] = [],
		client?: RTCClient | Partial<RTCClient> | null,
	): Promise<any> {
		const send = (nodeId: string) =>
			this.controller.requestToChannelOwner(nodeId, {
				target: "channel",
				channel_id: this.channelId,
				method,
				args,
				client: this.controller.serializeClient(client),
			})

		try {
			return await send(this.nodeId)
		} catch (error: any) {
			if (!isChannelMovedError(error)) throw error

			// the channel was taken over by another node, follow it once
			const owner = await this.controller.ownership.resolve(this.channelId)

			if (!owner || owner.node_id === this.nodeId) throw error

			this.nodeId = owner.node_id

			return await send(this.nodeId)
		}
	}

	joinClient(client: RTCClient, options?: any) {
		return this.call("joinClient", [options], client)
	}

	leaveClient(client: Partial<RTCClient>, options?: any) {
		return this.call("leaveClient", [options], client as RTCClient)
	}

	createTransport(client: RTCClient) {
		return this.call("createTransport", [], client)
	}

	connectTransport(client: RTCClient, payload: any) {
		return this.call("connectTransport", [payload], client)
	}

	produce(client: RTCClient, payload: any) {
		return this.call("produce", [payload], client)
	}

	stopProduce(client: RTCClient, payload: any) {
		return this.call("stopProduce", [payload], client)
	}

	consume(client: RTCClient, payload: any) {
		return this.call("consume", [payload], client)
	}

	stopConsume(client: RTCClient, payload: any) {
		return this.call("stopConsume", [payload], client)
	}

	consumerControl(client: RTCClient, payload: any) {
		return this.call("consumerControl", [payload], client)
	}

	handleClientEvent(client: RTCClient, payload: any) {
		return this.call("handleClientEvent", [payload], client)
	}

	handleSoundpadDispatch(client: RTCClient, payload: any) {
		return this.call("handleSoundpadDispatch", [payload], client)
	}

	updateClientVoiceState(client: RTCClient, update: any) {
		return this.call("updateClientVoiceState", [update], client)
	}

	rebindClient(client: RTCClient) {
		return this.call("rebindClient", [], client)
	}
}

export type MediaChannelRef = MediaChannel | RemoteMediaChannel

export default RemoteMediaChannel
