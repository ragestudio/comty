import type { RTCClient } from "@services/rtc/types"
import type { Server } from "linebridge"

import { Worker as SnowflakeWorker } from "@shared-classes/Snowflake"
import { MediaChannel } from "@classes/MediaChannel"
import { StorageType } from "@nats-io/jetstream"

import { SfuNodeDiscovery } from "./sfu_discovery"
import { SFUNode } from "./sfu/node"
import { Bucket, KvManager } from "@shared-classes/KV"
import { Users } from "./users"
import { IPC } from "./ipc"
import { ChannelOwnership, OWNERSHIP_RENEW_MS } from "./ownership"
import type { ChannelOwner } from "./ownership"
import { RemoteMediaChannel } from "./remote"
import type { MediaChannelRef } from "./remote"

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
import serializeClient from "./handlers/serializeClient"
import requestToChannelOwner from "./handlers/requestToChannelOwner"
import handleRemoteCall from "./handlers/handleRemoteCall"
import leaveUser from "./handlers/leaveUser"
import disconnectUser from "./handlers/disconnectUser"

import Bind from "@comty/shared/utils/bind"

type PendingDisconnectEntry = {
	timeout: NodeJS.Timeout
	channelId: string
}

export default class MediaChannelsController {
	snowflakeWorker: SnowflakeWorker
	controller_id: string

	// node this controller runs on, channels are routed to their owner node
	nodeId: string = process.env.LB_NODE_ID ?? "local"

	server: Server
	ipc: IPC | null = null
	kv: KvManager = new KvManager()
	users: Users

	sfuDiscovery = new SfuNodeDiscovery(this)
	mediaChannelsStateBucket: Bucket
	ownership: ChannelOwnership
	ownershipTimer: NodeJS.Timeout | null = null
	remoteChannelSub: any = null

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
		for (const node of this.sfuDiscovery.nodes) {
			const alive = await node.alive().catch(() => false)

			if (alive) return node
		}

		throw new Error("No SFU nodes available")
	}

	getInstance = Bind(this, getInstance)

	serializeClient = Bind(this, serializeClient)
	requestToChannelOwner = Bind(this, requestToChannelOwner)
	handleRemoteCall = Bind(this, handleRemoteCall)
	leaveUser = Bind(this, leaveUser)
	disconnectUser = Bind(this, disconnectUser)

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

		// channel ownership, a channel is served by exactly one controller
		this.ownership = new ChannelOwnership(this.controller_id, this.nodeId)

		this.ownership.init(await this.kv.bucket("mediachannels-ownership"))

		this.startOwnershipRenew()
		this.subscribeRemoteChannelCalls()

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

	async getClientChannel(client: RTCClient): Promise<MediaChannelRef> {
		let channelId =
			(await this.users.get(client.userId)) || client.channel_id

		if (!channelId) {
			throw new Error("No channel joined")
		}

		// the channel is served by another node, forward the operation there
		const owner = await this.ownership.resolve(channelId)

		if (owner && owner.node_id !== this.nodeId) {
			return new RemoteMediaChannel(this, channelId, owner.node_id)
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

	/** keeps the ownership claims alive while the channel exists */
	startOwnershipRenew() {
		if (this.ownershipTimer) return

		let ticks = 0

		this.ownershipTimer = setInterval(() => {
			ticks++

			this.ownership
				.renewAll(this.instances.keys())
				.catch((error) =>
					console.error(
						"[media-channels] failed to renew channel ownership",
						error,
					),
				)

			// refresh the shared state so an idle channel does not expire
			if (ticks % 6 === 0) {
				for (const channelId of this.instances.keys()) {
					this.markInstanceDirty(channelId)
				}
			}
		}, OWNERSHIP_RENEW_MS)
	}

	/** listens for channel operations forwarded by other nodes */
	subscribeRemoteChannelCalls() {
		const nats = this.server.nats?.connection

		if (!nats) return

		this.remoteChannelSub = nats.subscribe(`rtc.channel.${this.nodeId}`)

		const loop = async () => {
			for await (const msg of this.remoteChannelSub) {
				try {
					await this.handleRemoteCall(msg)
				} catch (error) {
					console.error(
						"[media-channels] failed to handle remote call",
						error,
					)
				}
			}
		}

		loop()
	}

	/** claims a channel for this controller, returns the current owner */
	claimChannel = async (channelId: string): Promise<ChannelOwner> => {
		return await this.ownership.claim(channelId)
	}

	markInstanceDirty = (channelId: string) => {
		this.dirtyInstances.add(channelId)
	}

	unmarkInstanceDirty = (channelId: string) => {
		this.dirtyInstances.delete(channelId)
	}

	flushDirtyInstancesState = Bind(this, flushDirtyInstancesState)
	createChannelInstance = Bind(this, createChannelInstanceHandler)

	joinClient = Bind(this, joinClient)
	leaveClient = Bind(this, leaveClient)

	getUserJoinedGroupsIds = Bind(this, getUserJoinedGroupsIds)
	findChannelsByGroupId = Bind(this, findChannelsByGroupId)

	handleUserConnectedToSocket = Bind(this, handleUserConnectedToSocket)
	handleUserDisconnectedToSocket = Bind(this, handleUserDisconnectedToSocket)

	validateGroupAccess = Bind(this, validateGroupAccess)

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
