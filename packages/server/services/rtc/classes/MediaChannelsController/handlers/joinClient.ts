import GroupChannelsModel from "@db/group_channels"

import type MediaChannelsController from "../index"
import type MediaChannel from "@classes/MediaChannel"
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
		const owner = await this.claimChannel(channelId)

		if (owner.node_id !== this.nodeId) {
			return await this.requestToChannelOwner(owner.node_id, {
				target: "controller",
				method: "joinClient",
				args: [group_id, channelId],
				client: this.serializeClient(client),
			})
		}

		// check cache for existing membership
		const joinedChannel = await this.users.get(client.userId)

		// enforce the channel user limit for new joins
		const rawParams: any = channel.params
		const userLimitValue =
			rawParams instanceof Map
				? rawParams.get("user_limit")
				: rawParams?.user_limit

		const userLimit = Number.parseInt(String(userLimitValue ?? "0"), 10)

		if (userLimit > 0 && joinedChannel !== channelId) {
			// ownership was just claimed, so the instance is always local
			const existingInstance = (await this.getInstance(
				channelId,
				client,
			)) as MediaChannel | null

			if (
				existingInstance &&
				existingInstance.clients.size >= userLimit
			) {
				throw new OperationError(403, "Channel is full")
			}
		}

		// // if the user is already in the channel, skip
		// if (joinedChannel === channelId) {
		// 	return null
		// }

		// check if this is a reconnection (user already in a channel)
		if (joinedChannel) {
			// if joining a different channel, leave the old one first
			if (joinedChannel !== channelId) {
				await this.leaveClient(client)
			} else {
				// check if reconnection is possible
				const channelInstance = (await this.getInstance(
					channelId,
					client,
				)) as MediaChannel | null

				if (channelInstance && !channelInstance.closed) {
					// replace old client reference
					const oldClient = setFind(
						channelInstance.clients,
						(c: RTCClient) => c.userId === client.userId,
					)

					if (oldClient) {
						this.cleanupOrphanedResources(oldClient)
						channelInstance.clients.delete(oldClient)
					}

					// update cache
					await this.users.set(client.userId, channelId)

					console.log(
						`[media-channels] User ${client.userId} reconnected to channel ${channelId}`,
					)

					return await channelInstance.joinClient(client, {
						isReconnection: true,
					})
				}

				console.log(
					`[media-channels] User ${client.userId} rejoining after channel was closed`,
				)
			}
		}

		// get or create channel instance
		let channelInstance = (await this.getInstance(
			channelId,
			client,
		)) as MediaChannel | null

		if (!channelInstance || channelInstance?.closed === true) {
			channelInstance = await this.createChannelInstance(
				channel.group_id,
				channelId,
			)
		}

		await this.users.set(client.userId, channelId)

		return await channelInstance.joinClient(client)
	} catch (error) {
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}
