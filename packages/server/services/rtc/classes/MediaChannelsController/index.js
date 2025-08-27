import * as mediasoup from "mediasoup"
import MediaChannel from "@classes/MediaChannel"

import allowedMediaCodecs from "./allowedMediaCodecs.json"

import joinClient from "./handlers/joinClient"
import leaveClient from "./handlers/leaveClient"

import handleUserConnectedToSocket from "./handlers/handleUserConnectedToSocket"
import handleUserDisconnectedToSocket from "./handlers/handleUserDisconnectedToSocket"

import getUserJoinedGroupsIds from "./handlers/getUserJoinedGroupsIds"
import findChannelsByGroupId from "./handlers/findChannelsByGroupId"
import dispatchGroupStateUpdate from "./handlers/dispatchGroupStateUpdate"

export default class MediaChannelsController {
	constructor(server) {
		this.server = server
	}

	static allowedMediaCodecs = allowedMediaCodecs

	worker = null
	instances = new Map()

	async initialize() {
		try {
			console.log("Initializing mediasoup worker...")

			this.worker = await mediasoup.createWorker({
				rtcMinPort: 10000,
				rtcMaxPort: 10100,
				logLevel: "warn",
				logTags: [
					"info",
					"ice",
					"dtls",
					"rtp",
					"srtp",
					"rtcp",
					"rtx",
					"bwe",
					"score",
					"simulcast",
					"svc",
				],
			})

			this.worker.on("died", (error) => {
				console.error("mediasoup worker died:", error)
				setTimeout(() => globalThis.process.exit(1), 2000)
			})

			// subcribe to websocket user connections
			this.server.eventBus.on(
				"user:connected",
				this.handleUserConnectedToSocket,
			)
			this.server.eventBus.on(
				"user:disconnect",
				this.handleUserDisconnectedToSocket,
			)

			console.log("Mediasoup worker initialized successfully")
		} catch (error) {
			console.error("Error initializing mediasoup worker:", error)
			throw error
		}
	}

	joinClient = joinClient.bind(this)
	leaveClient = leaveClient.bind(this)

	getUserJoinedGroupsIds = getUserJoinedGroupsIds.bind(this)
	findChannelsByGroupId = findChannelsByGroupId.bind(this)

	handleUserConnectedToSocket = handleUserConnectedToSocket.bind(this)
	handleUserDisconnectedToSocket = handleUserDisconnectedToSocket.bind(this)

	// group state handlers
	dispatchGroupStateUpdate = dispatchGroupStateUpdate.bind(this)

	async subscribeGroupState(client, groupId) {
		await this.validateGroupAccess(client.userId, groupId)
		await client.subscribe(groupId)
	}

	async unsubscribeGroupState(client, groupId) {
		await client.unsubscribe(groupId)
	}

	async createChannelInstance(groupId, channelId) {
		const GroupChannelsModel = global.scylla.model("group_channels")

		const channel = await GroupChannelsModel.findOneAsync({
			_id: channelId,
			group_id: groupId,
		})

		if (!channel) {
			throw new Error("Channel not found")
		}

		const channelInstance = new MediaChannel({
			data: channel.toJSON(),
			channelId: channelId,
			worker: this.worker,
			mediaCodecs: MediaChannelsController.allowedMediaCodecs,
		})

		await channelInstance.initialize()

		return channelInstance
	}

	getClientChannel(client) {
		if (!client.currentMediaChannel) {
			throw new Error("No media channel joined")
		}

		const channelInstance = this.instances.get(client.currentMediaChannel)

		if (!channelInstance) {
			throw new Error("Media channel instance not found")
		}

		return channelInstance
	}

	cleanupOrphanedResources(client) {
		if (client.transports) {
			for (const [, transport] of client.transports) {
				try {
					if (!transport.closed) {
						transport.close()
					}
				} catch (error) {
					console.error("Error closing orphaned transport:", error)
				}
			}
			client.transports.clear()
		}
	}

	async validateGroupAccess(userId, groupId) {
		const GroupsModel = global.scylla.model("groups")
		const GroupMembershipsModel = global.scylla.model("group_memberships")

		const group = await GroupsModel.findOneAsync(
			{ _id: groupId },
			{
				raw: true,
			},
		)

		if (!group) {
			throw new Error("Group not found")
		}

		const memberships = await GroupMembershipsModel.findAsync(
			{
				group_id: group._id,
			},
			{
				raw: true,
			},
		)

		const membership = memberships.find(
			(member) => member.user_id === userId,
		)

		if (!membership) {
			throw new Error("Cannot access this group")
		}

		return group
	}
}
