import type { RTCClient } from "@services/rtc/types"
import type MediaChannelsController from ".."
import type { ChannelClaim } from "../ownership"

import { MediaChannel, SerializedMediaChannel } from "@classes/MediaChannel"
import { normalizeClientUser } from "@shared-utils/clientUser"
import { RemoteMediaChannel } from "../remote"
import type { MediaChannelRef } from "../remote"
import discardState from "./discardState"
import createRemoteClient from "./remoteClient"
import { RemoteRouterTransport } from "../sfu/transport"

export type GetInstanceOptions = {
	bindClient?: RTCClient
	// adds the client to the instance when it is not part of it. used by
	// operations of a membership that lost its session, a join adds itself
	attachClient?: boolean
	// creates a fresh instance when there is no restorable session
	create?: { groupId: string }
}

type StateSession = {
	sfuNode: any
	router: any
}

function isClient(value: any): value is RTCClient {
	return !!value && typeof value === "object" && "userId" in value
}

/**
 * Makes sure the live client is part of the instance. A restored placeholder
 * is replaced by it, an instance that never saw the client gets it added.
 */
function attachClient(
	instance: any,
	client?: RTCClient,
	channelId?: string,
	force: boolean = false,
) {
	if (!client || !instance || instance.is_remote) return

	if (instance.bindClient(client)) return

	if (!force) return

	const exists = Array.from(instance.clients as Set<RTCClient>).some(
		(c) => c.userId === client.userId,
	)

	if (exists) return

	client.channel_id = channelId ?? instance.channelId

	if (!client.voiceState) {
		client.voiceState = { muted: false, deafen: false }
	}

	instance.clients.add(client)

	// the roster did not know this client, publish it like a join would
	instance.events?.emit?.("client:join", instance, client)
}

function deserializeMaps(state: SerializedMediaChannel) {
	const producersMap = new Map<string, Map<string, any>>()
	const consumersMap = new Map<string, any[]>()

	if (state.producers) {
		for (const [userId, userProducers] of Object.entries(state.producers)) {
			const innerMap = new Map<string, any>()
			for (const [producerId, producerData] of Object.entries(userProducers)) {
				innerMap.set(producerId, producerData)
			}
			producersMap.set(userId, innerMap)
		}
	}

	if (state.consumers) {
		for (const [consumerId, consumers] of Object.entries(state.consumers)) {
			consumersMap.set(consumerId, consumers)
		}
	}

	return { producers: producersMap, consumers: consumersMap }
}

/**
 * A persisted session is only usable while the sfu router that holds it still
 * exists. The router also tells us which channel it serves, so a corrupted or
 * reused id can not resurrect another channel.
 */
async function resolveStateSession(
	this: MediaChannelsController,
	state: SerializedMediaChannel,
	channelId: string,
): Promise<StateSession | null> {
	if (!state.router_id || !state.sfu_node_id) return null

	const findNode = () =>
		this.sfuDiscovery.nodes.find(
			(node) => node.node_id.toString() === String(state.sfu_node_id),
		)

	let sfuNode = findNode()

	if (!sfuNode) {
		// the registration may still be loading while the service starts
		await this.sfuDiscovery.refresh().catch(() => null)

		sfuNode = findNode()
	}

	if (!sfuNode) return null

	try {
		const router = await sfuNode.getRouter(state.router_id)

		if (!router) return null
		if (router.channelId && router.channelId !== channelId) return null

		return { sfuNode, router }
	} catch {
		return null
	}
}

/** rebuilds the in-memory instance from a persisted session */
async function adoptState(
	this: MediaChannelsController,
	state: SerializedMediaChannel,
	claim: ChannelClaim,
): Promise<MediaChannel | null> {
	const session = await resolveStateSession.call(this, state, state.channel_id)

	if (!session) return null

	const instance = new MediaChannel(
		{
			data: state.data,
			channelId: state.channel_id,
			mediaCodecs: state.mediaCodecs,
		},
		this,
		session.sfuNode,
		session.router,
	)

	instance.sfu_node = session.sfuNode
	instance.router = session.router
	instance.started_at = new Date(state.started_at)
	instance.ownershipEpoch = claim.owner.epoch

	// the adopted instance must publish the same events as a created one
	const groupId = state.data?.group_id

	if (groupId) {
		this.attachChannelEvents(instance, String(groupId))
	}

	const restoredClients = (state.clients ?? []).map((client) => {
		// restored clients only keep the persisted state, the profile is part
		// of it so no memory reference is needed
		const user = normalizeClientUser(client.user) ?? {
			_id: client.userId,
		}

		const restoredClient: any = createRemoteClient({
			userId: client.userId,
			channelId: state.channel_id,
			user,
			voiceState: client.voiceState,
		})

		// the transports still exist on the sfu node, the proxy only needs the
		// id so the client can keep producing and consuming on them
		if (client.transports?.length) {
			const transports = new Map<string, any>()

			for (const transportId of client.transports) {
				transports.set(
					transportId,
					new RemoteRouterTransport(session.sfuNode, {
						id: transportId,
					}),
				)
			}

			restoredClient.transports = transports
		}

		return restoredClient
	})

	instance.clients = new Set(restoredClients as RTCClient[])

	const { producers, consumers } = deserializeMaps(state)
	instance.producers = producers
	instance.consumers = consumers
	instance.lastActivityAt = Date.now()

	console.log(
		`[media-channels] restored channel [${state.channel_id}] from state`,
	)

	return instance
}

/**
 * Returns the local instance of a channel, restoring it from the shared state
 * or creating a new one. Ownership is claimed before touching the session, so
 * two nodes can never adopt the same channel.
 */
export default async function (
	this: MediaChannelsController,
	channelId: string,
	bindClientOrOptions?: RTCClient | GetInstanceOptions,
): Promise<MediaChannelRef | null> {
	const options: GetInstanceOptions = isClient(bindClientOrOptions)
		? { bindClient: bindClientOrOptions }
		: (bindClientOrOptions ?? {})

	const local = this.instances.get(channelId)

	if (local) {
		if (!local.closed) {
			attachClient(local, options.bindClient, channelId, options.attachClient)

			return local
		}

		this.instances.delete(channelId)
	}

	return await this.withInstanceLock(channelId, async () => {
		const current = this.instances.get(channelId)

		if (current && !current.closed) {
			attachClient(current, options.bindClient, channelId, options.attachClient)

			return current
		}

		const claim = await this.claimChannel(channelId)

		// another node owns the channel, operations must be forwarded there
		if (!claim.owned) {
			if (!claim.owner.epoch) return null

			// a different controller on this node owns it, it cannot be
			// forwarded to the same node
			if (claim.owner.node_id === this.nodeId) {
				console.warn(
					`[media-channels] channel [${channelId}] is served by controller [${claim.owner.controller_id}] of this node`,
				)

				return null
			}

			return new RemoteMediaChannel(this, channelId, claim.owner.node_id)
		}

		try {
			const state =
				await this.mediaChannelsStateBucket.get<SerializedMediaChannel>(
					channelId,
				)

			if (state && !state.closed) {
				// a state stored under another channel is corrupted
				if (state.channel_id !== channelId) {
					await this.mediaChannelsStateBucket.delete(channelId)
					return null
				}

				const stateEpoch = Number(state.ownership?.epoch ?? 0)

				// a newer epoch exists, this claim is already stale
				if (stateEpoch > claim.owner.epoch) {
					return null
				}

				const restored = await adoptState.call(this, state, claim)

				if (restored) {
					attachClient(
						restored,
						options.bindClient,
						channelId,
						options.attachClient,
					)

					this.instances.set(channelId, restored)

					// rewrite the state with the new ownership epoch
					this.markInstanceDirty(channelId)

					return restored
				}

				console.warn(
					`[media-channels] channel [${channelId}] session is orphaned, discarding it`,
				)

				await discardState.call(this, channelId, state)
			} else if (state) {
				await this.mediaChannelsStateBucket.delete(channelId)
			}

			if (!options.create) return null

			const created = await this.createChannelInstance(
				options.create.groupId,
				channelId,
			)

			// an operation of an existing membership also has to rejoin it
			attachClient(created, options.bindClient, channelId, options.attachClient)

			return created
		} catch (error) {
			// a failed creation must not keep a claim nobody serves
			await this.ownership.release(channelId).catch(() => null)
			throw error
		}
	})
}
