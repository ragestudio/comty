import * as mediasoup from "mediasoup"
import { Group, GroupChannel } from "@db_models"
import MediaChannel from "@classes/MediaChannel"

export default class MediaChannelsController {
	constructor(server) {
		this.server = server
	}

	worker = null
	instances = new Map()

	static mediaCodecs = [
		{
			kind: "audio",
			mimeType: "audio/opus",
			clockRate: 48000,
			channels: 2,
		},
		{
			kind: "video",
			mimeType: "video/VP8",
			clockRate: 90000,
			parameters: {
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/VP9",
			clockRate: 90000,
			parameters: {
				"profile-id": 2,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/h264",
			clockRate: 90000,
			parameters: {
				"packetization-mode": 1,
				"profile-level-id": "4d0032",
				"level-asymmetry-allowed": 1,
				"x-google-start-bitrate": 1000,
			},
		},
		{
			kind: "video",
			mimeType: "video/H264",
			clockRate: 90000,
			parameters: {
				"packetization-mode": 1,
				"profile-level-id": "42e01f",
				"level-asymmetry-allowed": 1,
				"x-google-start-bitrate": 1000,
			},
		},
	]

	async joinClient(client, channelId) {
		try {
			// Validate channel access
			await this._validateChannelAccess(client.userId, channelId)

			// Cleanup existing connection
			if (client.currentMediaChannel) {
				await this.leaveClient(client)
				await new Promise((resolve) => setTimeout(resolve, 100))
			}

			// Get or create channel instance
			let channelInstance = this.instances.get(channelId)

			if (!channelInstance) {
				channelInstance = await this._createChannelInstance(channelId)
				this.instances.set(channelId, channelInstance)
			}

			// Set client channel
			client.currentMediaChannel = channelId

			// Join client to channel
			const result = await channelInstance.joinClient(client)

			// try to public to MQTT
			globalThis.websockets.senders.toTopic(
				channelInstance.data.group_id,
				`group:${channelInstance.data.group_id}:state:update`,
				{
					event: "client:joined",
					userId: client.userId,
					channelId: channelId,
					channelClients: Array.from(channelInstance.clients).map(
						(c) => {
							return {
								userId: c.userId,
							}
						},
					),
				},
			)

			return result
		} catch (error) {
			console.error(`Error joining client ${client.userId}:`, error)
			throw error
		}
	}

	async leaveClient(client) {
		try {
			if (!client.currentMediaChannel) {
				this._cleanupOrphanedResources(client)
				return
			}

			const channelId = client.currentMediaChannel

			const channelInstance = this.instances.get(channelId)

			if (!channelInstance) {
				client.currentMediaChannel = null
				this._cleanupOrphanedResources(client)
				return
			}

			// Leave channel
			await channelInstance.leaveClient(client)

			// Reset client state
			client.currentMediaChannel = null

			// Notify client
			await client.emit("media:channel:leave", { channelId })

			// Cleanup empty channel
			if (channelInstance.clients.size === 0) {
				console.log(`Closing empty channel ${channelId}`)
				await channelInstance.close()
				this.instances.delete(channelId)
			}

			// try to public to MQTT
			globalThis.websockets.senders.toTopic(
				channelInstance.data.group_id,
				`group:${channelInstance.data.group_id}:state:update`,
				{
					event: "client:left",
					userId: client.userId,
					groupId: channelInstance.data.group_id,
					channelId: channelId,
					channelClients: Array.from(channelInstance.clients).map(
						(c) => {
							return {
								userId: c.userId,
							}
						},
					),
				},
			)

			console.log(`Client ${client.userId} left channel ${channelId}`)
		} catch (error) {
			console.error(`Error leaving client ${client.userId}:`, error)
		}
	}

	async subscribeGroupState(client, groupId) {
		await this._validateGroupAccess(client.userId, groupId)

		await client.subcribe(groupId)
	}

	async unsubscribeGroupState(client, groupId) {
		await client.unsubcribe(groupId)
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

	getChannel(channelId) {
		return this.instances.get(channelId)
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

			console.log("Mediasoup worker initialized successfully")
		} catch (error) {
			console.error("Error initializing mediasoup worker:", error)
			throw error
		}
	}

	findChannelsByGroupId(groupId) {
		return Array.from(this.instances.values()).filter((channelInstance) => {
			return channelInstance.data.group_id === groupId
		})
	}

	// Private methods
	async _validateChannelAccess(userId, channelId) {
		const channel = await GroupChannel.findOne({ _id: channelId })

		if (!channel) {
			throw new Error("Channel not found")
		}

		const group = await Group.findOne({ _id: channel.group_id })

		if (!group) {
			throw new Error("Associated group not found")
		}

		const membership = group.members.find(
			(member) => member.user_id === userId,
		)

		if (!membership) {
			throw new Error("Cannot access this channel")
		}

		return { channel, group }
	}

	async _validateGroupAccess(userId, groupId) {
		const group = await Group.findOne({ _id: groupId })

		if (!group) {
			throw new Error("Group not found")
		}

		const membership = group.members.find(
			(member) => member.user_id === userId,
		)

		if (!membership) {
			throw new Error("Cannot access this group")
		}

		return group
	}

	async _createChannelInstance(channelId) {
		const channel = await GroupChannel.findOne({ _id: channelId })

		if (!channel) {
			throw new Error("Channel not found")
		}

		const channelInstance = new MediaChannel({
			data: channel.toObject(),
			channelId: channelId,
			worker: this.worker,
			mediaCodecs: MediaChannelsController.mediaCodecs,
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
