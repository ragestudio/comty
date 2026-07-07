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

import type { MediaChannel } from "@classes/MediaChannel/index.ts"
import type { Server } from "linebridge"
import { RTCClient } from "@services/rtc/types"

export default class MediaChannelsController {
	server: Server

	constructor(server: Server) {
		this.server = server
	}

	static allowedMediaCodecs = allowedMediaCodecs

	worker: mediasoup.types.Worker = null
	webrtcServer: mediasoup.types.WebRtcServer = null
	instances: Map<string, MediaChannel> = new Map()
	usersMap: Map<string, string> = new Map()
	pendingDisconnectsTimeout: Map<string, NodeJS.Timeout> = new Map()

	async initialize(): Promise<void> {
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

	joinClient = joinClient.bind(this) as OmitThisParameter<typeof joinClient>
	leaveClient = leaveClient.bind(this) as OmitThisParameter<
		typeof leaveClient
	>

	getUserJoinedGroupsIds = getUserJoinedGroupsIds.bind(
		this,
	) as OmitThisParameter<typeof getUserJoinedGroupsIds>
	findChannelsByGroupId = findChannelsByGroupId.bind(
		this,
	) as OmitThisParameter<typeof findChannelsByGroupId>

	handleUserConnectedToSocket = handleUserConnectedToSocket.bind(
		this,
	) as OmitThisParameter<typeof handleUserConnectedToSocket>
	handleUserDisconnectedToSocket = handleUserDisconnectedToSocket.bind(
		this,
	) as OmitThisParameter<typeof handleUserDisconnectedToSocket>

	validateGroupAccess = validateGroupAccess.bind(this) as OmitThisParameter<
		typeof validateGroupAccess
	>
	createChannelInstance = createChannelInstance.bind(
		this,
	) as OmitThisParameter<typeof createChannelInstance>

	static getAnnouncedIp = (): string => {
		let announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP

		if (!announcedIp) {
			announcedIp =
				process.env.NODE_ENV === "production"
					? "127.0.0.1"
					: "127.0.0.1"
		}

		return announcedIp
	}

	getClientChannel(client: RTCClient): MediaChannel {
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

	cleanupOrphanedResources(client: RTCClient): void {
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

	async sendToGroupTopic(
		group_id: string,
		event: string,
		payload: any,
	): Promise<any> {
		const topic = `group:${group_id}`

		try {
			return await globalThis.websockets.senders.toTopic(
				topic,
				`${topic}:${event}`,
				payload,
			)
		} catch (error) {
			console.error(`[CHANNEL] Error sending to group topic`, error)
		}
	}
}
