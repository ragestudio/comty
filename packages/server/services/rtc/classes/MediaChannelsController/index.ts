import type { RTCClient } from "@services/rtc/types"
import type { Server } from "linebridge"

import { Worker as SnowflakeWorker } from "@shared-classes/Snowflake"
import { MediaChannel, SerializedMediaChannel } from "@classes/MediaChannel"
import { StorageType } from "@nats-io/jetstream"

import { SfuNodeDiscovery } from "./sfu_discovery"
import { SFUNode } from "./sfu/node"
import { Bucket, KvManager } from "@shared-classes/KV"
import { IPC } from "./ipc"

import createChannelInstanceHandler from "./handlers/createChannelInstance"
import validateGroupAccess from "./handlers/validateGroupAccess"

import joinClient from "./handlers/joinClient"
import leaveClient from "./handlers/leaveClient"

import handleUserConnectedToSocket from "./handlers/handleUserConnectedToSocket"
import handleUserDisconnectedToSocket from "./handlers/handleUserDisconnectedToSocket"

import findChannelsByGroupId from "./handlers/findChannelsByGroupId"
import getUserJoinedGroupsIds from "./handlers/getUserJoinedGroupsIds"
import flushDirtyInstancesState from "./handlers/flushDirtyInstancesState"
import getInstance from "./handlers/getInstance"
import { Users } from "./users"

type PendingDisconnectEntry = {
	timeout: NodeJS.Timeout
	channelId: string
}

export default class MediaChannelsController {
	snowflakeWorker: SnowflakeWorker
	controller_id: string

	server: Server
	ipc: IPC | null = null
	kv: KvManager = new KvManager()
	users: Users

	sfuDiscovery = new SfuNodeDiscovery(this)
	mediaChannelsStateBucket: Bucket
	//mediaChannelsOwnershipBucket: Bucket

	instances: Map<string, MediaChannel> = new Map()
	pendingDisconnectsTimeout: Map<string, PendingDisconnectEntry> = new Map()

	dirtyInstances: Set<string> = new Set()
	flushTimer: NodeJS.Timeout | null = null
	isFlushing: boolean = false
	flushChunkSize: number = 25

	constructor(server: Server) {
		this.server = server
		this.snowflakeWorker = new SnowflakeWorker()
		this.controller_id = this.snowflakeWorker.nextId().toString()
	}

	// TODO: implement find strategy
	pickSfuNode = async (): Promise<SFUNode> => {
		const node = this.sfuDiscovery.nodes[0]

		if (!node) throw new Error("No SFU nodes available")

		return node
	}

	getInstance = getInstance.bind(this) as OmitThisParameter<
		typeof getInstance
	>

	async initialize() {
		// initialize KV engine
		this.kv.init(this.server.nats.connection)

		// initialize users & ipc
		this.users = new Users(this.server.contexts.redis?.client)
		this.ipc = new IPC(this.server.nats.connection)

		// create flush timer
		this.flushTimer = setInterval(
			() => this.flushDirtyInstancesState(),
			2000,
		)

		// initialize media channels state bucket
		this.mediaChannelsStateBucket = await this.kv.bucket(
			"mediachannels-states",
			{
				compression: true,
				storage: StorageType.File,
				history: 1,
				ttl: 3600000,
			},
		)

		// register SFU discovery event handlers & init discovery
		await this.sfuDiscovery.init()

		// websocket connection tracking
		this.server.eventBus.on(
			"user:connected",
			this.handleUserConnectedToSocket,
		)
		this.server.eventBus.on(
			"user:disconnect",
			this.handleUserDisconnectedToSocket,
		)
	}

	async getClientChannel(client: RTCClient): Promise<MediaChannel> {
		let channelId =
			(await this.users.get(client.userId)) || client.channel_id

		if (!channelId) {
			throw new Error("No channel joined")
		}

		let channelInstance = await this.getInstance(channelId, client)

		if (channelInstance && channelInstance.closed) {
			channelInstance = null
		}

		if (!channelInstance) {
			throw new Error("Media channel instance not found")
		}

		return channelInstance
	}

	markInstanceDirty = (channelId: string) => {
		this.dirtyInstances.add(channelId)
	}

	unmarkInstanceDirty = (channelId: string) => {
		this.dirtyInstances.delete(channelId)
	}

	flushDirtyInstancesState = flushDirtyInstancesState.bind(
		this,
	) as OmitThisParameter<typeof flushDirtyInstancesState>

	createChannelInstance = createChannelInstanceHandler.bind(
		this,
	) as OmitThisParameter<typeof createChannelInstanceHandler>

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

	cancelPendingDisconnect(userId: string): boolean {
		const entry = this.pendingDisconnectsTimeout.get(userId)

		if (entry) {
			clearTimeout(entry.timeout)
			this.pendingDisconnectsTimeout.delete(userId)

			console.log(
				`[media-channels] Cancelled pending disconnect for user ${userId}`,
			)

			return true
		}

		return false
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
