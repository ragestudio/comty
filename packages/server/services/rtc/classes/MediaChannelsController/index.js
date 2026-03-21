import * as mediasoup from "mediasoup"

import allowedMediaCodecs from "./allowedMediaCodecs.json"

import createChannelInstance from "./handlers/createChannelInstance"
import validateGroupAccess from "./handlers/validateGroupAccess"

import joinClient from "./handlers/joinClient"
import leaveClient from "./handlers/leaveClient"

import handleUserConnectedToSocket from "./handlers/handleUserConnectedToSocket"
import handleUserDisconnectedToSocket from "./handlers/handleUserDisconnectedToSocket"

import findChannelsByGroupId from "./handlers/findChannelsByGroupId"
import getUserJoinedGroupsIds from "./handlers/getUserJoinedGroupsIds"

export default class MediaChannelsController {
	constructor(server) {
		this.server = server
	}

	static allowedMediaCodecs = allowedMediaCodecs

	worker = null
	webrtcServer = null
	instances = new Map()
	usersMap = new Map()

	async initialize() {
		try {
			console.log("Initializing mediasoup worker...")

			this.worker = await mediasoup.createWorker({
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

			this.webrtcServer = await this.worker.createWebRtcServer({
				listenInfos: [
					{
						protocol: "udp",
						ip: "0.0.0.0",
						announcedIp: MediaChannelsController.getAnnouncedIp(),
						port: 40000, // should be unique per worker
					},
					{
						protocol: "tcp",
						ip: "0.0.0.0",
						announcedIp: MediaChannelsController.getAnnouncedIp(),
						port: 40000,
					},
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

	validateGroupAccess = validateGroupAccess.bind(this)
	createChannelInstance = createChannelInstance.bind(this)

	static getAnnouncedIp = () => {
		let announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP

		if (!announcedIp) {
			announcedIp =
				process.env.NODE_ENV === "production"
					? clientIp || "127.0.0.1"
					: "127.0.0.1"
		}

		return announcedIp
	}

	getClientChannel(client) {
		const currentUserMediaChannel = this.usersMap.get(client.userId)

		if (!currentUserMediaChannel) {
			throw new Error("No media channel joined")
		}

		const channelInstance = this.instances.get(currentUserMediaChannel)

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
}
