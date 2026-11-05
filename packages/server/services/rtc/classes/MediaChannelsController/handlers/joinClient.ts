import GroupChannelsModel from "@db/group_channels"

import type MediaChannelsController from "../index"
import type MediaChannel from "@classes/MediaChannel"
import type { MediaChannelRef } from "../remote"
import { RTCClient } from "@services/rtc/types"
import Gatekeeper from "@shared-classes/Spaces/Gatekeeper"
import setFind from "@shared-utils/setFind"
import { hydrateClientUser } from "@shared-utils/clientUser"

export default async function (
	this: MediaChannelsController,
	client: RTCClient,
	group_id: string,
	channelId: string,
) {
	try {
		const channel = await GroupChannelsModel.findOne(
			{
				group_id: group_id,
				_id: channelId,
			},
			{
				raw: true,
			},
		)

		if (!channel) {
			throw new Error("Channel not found")
		}

		// attach a stable profile resolved from the user id, the gateway
		// provided user object is not always available
		await hydrateClientUser(client, this.server.contexts.redis?.client)

		// Validate channel access
		await this.validateGroupAccess(client.userId, channel.group_id)

		const authz = await Gatekeeper.forGroup(channel.group_id, client.userId)

		authz.require(
			"VOICE_CONNECT",
			"You are not allowed to join this voice channel",
		)

		// cancel any pending disconnect timeout
		this.cancelPendingDisconnect(client.userId)

		// a channel has a single controller, the join runs there
		const claim = await this.claimChannel(channelId)

		if (!claim.owned) {
			return await this.requestToChannelOwner(claim.owner.node_id, {
				target: "controller",
				method: "joinClient",
				args: [group_id, channelId],
				client: this.serializeClient(client),
			})
		}

		// check cache for existing membership
		const joinedChannel = await this.users.get(client.userId)

		// moving to another channel, leave the previous one first
		if (joinedChannel && joinedChannel !== channelId) {
			await this.leaveClient(client)
		}

		// resolves the session on this node, restoring it from the shared
		// state when its owner is gone or creating a new one
		const resolved = (await this.getInstance(channelId, {
			bindClient: client,
			create: { groupId: channel.group_id },
		})) as MediaChannelRef | null

		if (!resolved) {
			throw new OperationError(404, "Channel instance not available")
		}

		// ownership moved while joining, forward the join to the new owner
		if ((resolved as any).is_remote) {
			return await this.requestToChannelOwner((resolved as any).nodeId, {
				target: "controller",
				method: "joinClient",
				args: [group_id, channelId],
				client: this.serializeClient(client),
			})
		}

		const channelInstance = resolved as MediaChannel

		const previous = setFind(
			channelInstance.clients,
			(c: RTCClient) => c.userId === client.userId,
		)

		// enforce the channel user limit for new joins
		const rawParams: any = channel.params
		const userLimitValue =
			rawParams instanceof Map
				? rawParams.get("user_limit")
				: rawParams?.user_limit

		const userLimit = Number.parseInt(String(userLimitValue ?? "0"), 10)
		const isReconnection = joinedChannel === channelId || Boolean(previous)

		if (
			userLimit > 0 &&
			!isReconnection &&
			channelInstance.clients.size >= userLimit
		) {
			throw new OperationError(403, "Channel is full")
		}

		// a previous reference of the same user belongs to an older socket
		if (previous && previous !== client) {
			this.cleanupOrphanedResources(previous)
			channelInstance.clients.delete(previous)
		}

		await this.users.set(client.userId, channelId)

		return await channelInstance.joinClient(client, {
			isReconnection: isReconnection,
		})
	} catch (error) {
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}
