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

	worker = null
	instances = new Map()

	static allowedMediaCodecs = allowedMediaCodecs

	joinClient = joinClient.bind(this)
	leaveClient = leaveClient.bind(this)

	handleUserConnectedToSocket = handleUserConnectedToSocket.bind(this)
	handleUserDisconnectedToSocket = handleUserDisconnectedToSocket.bind(this)

	getUserJoinedGroupsIds = getUserJoinedGroupsIds.bind(this)
	findChannelsByGroupId = findChannelsByGroupId.bind(this)

	// group state handlers
	dispatchGroupStateUpdate = dispatchGroupStateUpdate.bind(this)

	async subscribeGroupState(client, groupId) {
		await this._validateGroupAccess(client.userId, groupId)
		await client.subscribe(groupId)
	}

	async unsubscribeGroupState(client, groupId) {
		await client.unsubscribe(groupId)
	}

	async createWebRtcTransport(client) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.createWebRtcTransport(client)
	}

	async connectTransport(client, payload) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.connectTransport(client, payload)
	}

	async produce(client, payload) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.produce(client, payload)
	}

	async consume(client, payload) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.consume(client, payload)
	}

	async stopProduction(client, payload) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.stopProduction(client, payload)
	}

	async handleClientEvent(client, payload) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.handleClientEvent(client, payload)
	}

	async handleSoundpadDispatch(client, payload) {
		const channelInstance = this._getClientChannel(client)
		return await channelInstance.handleSoundpadDispatch(client, payload)
	}

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

	// Private methods
	async _validateChannelAccess(userId, channelId) {
		const GroupsModel = global.scylla.model("groups")
		const GroupChannelsModel = global.scylla.model("group_channels")
		const GroupMembershipsModel = global.scylla.model("group_memberships")

		const channel = await GroupChannelsModel.findOneAsync(
			{
				_id: channelId,
			},
			{
				raw: true,
			},
		)

		if (!channel) {
			throw new Error("Channel not found")
		}

		const group = await GroupsModel.findOneAsync(
			{ _id: channel.group_id },
			{
				raw: true,
			},
		)

		if (!group) {
			throw new Error("Associated group not found")
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
			throw new Error("Cannot access this channel")
		}

		return { channel, group }
	}

	async _validateGroupAccess(userId, groupId) {
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

	async _createChannelInstance(groupId, channelId) {
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

	_getClientChannel(client) {
		if (!client.currentMediaChannel) {
			throw new Error("No media channel joined")
		}

		const channelInstance = this.instances.get(client.currentMediaChannel)

		if (!channelInstance) {
			throw new Error("Media channel instance not found")
		}

		return channelInstance
	}

	_cleanupOrphanedResources(client) {
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
}
