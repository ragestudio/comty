import React from "react"
// @ts-ignore
import GroupsModel from "@models/groups"
import buildSocketEvents from "./events"
import loadChannelsStates from "../helpers/loadChannelsStates"
import {
	cacheGroup,
	cacheChannels,
	cacheMembers,
	cacheTotalMembers,
} from "../helpers/cache"

import db from "../store"

import type { Group } from "../collections/group"
import type { Channel, Channels, StatedChannel } from "../collections/channel"
import type { Member, Members } from "../collections/member"

const VALID_CHANNEL_KINDS = ["chat", "voice"] as const

export interface EventsUpdaters {
	setData: React.Dispatch<React.SetStateAction<Group>>
	setChannels: React.Dispatch<React.SetStateAction<Channels>>
	setMembers: React.Dispatch<React.SetStateAction<Members>>
	setConnectedMembers: React.Dispatch<React.SetStateAction<string[]>>
	setStatedChannels: React.Dispatch<
		React.SetStateAction<Record<string, StatedChannel>>
	>
}

export interface CachedGroup {
	group: Group | null

	memberships: Member[] | null
	total_members: number | null

	channels: Channels | null
}

const DEFAULT_CHANNELS_STATE = () => ({
	items: [],
	total_items: 0,
	has_more: false,
})
const DEFAULT_MEMBERS_STATE = () => ({
	items: [],
	total_items: 0,
	has_more: false,
})
const DEFAULT_GROUP_STATE = () => ({
	_id: null,
	name: null,
	description: null,
	cover: null,
	owner_user_id: null,
	groupCoverImageAverageColor: null,
	connectedMembers: [],
	channels: {
		items: [],
		total_items: 0,
		has_more: false,
	},
	members: {
		items: [],
		total_items: 0,
		has_more: false,
	},
})

export type UserConnectionReference = {
	connected: boolean
}

const useGroup = ({ group_id }) => {
	if (!group_id) {
		throw new Error("group_id is required")
	}

	const socket = React.useRef(app.cores.api.socket())

	const [loading, setLoading] = React.useState<boolean>(true)
	const [error, setError] = React.useState<Error | null>(null)

	const [data, setData] = React.useState<Group>(null)
	const [members, setMembers] = React.useState<Members>(null)
	const [channels, setChannels] = React.useState<Channels>(null)

	const [statedChannels, setStatedChannels] = React.useState<
		Record<string, StatedChannel>
	>({})

	const [connectedMembers, setConnectedMembers] = React.useState<string[]>([])
	const usersConnectionsRef: Map<string, UserConnectionReference> = new Map()

	const lastLoadedMemberId = React.useRef<string | null>(null)

	const fetchGroup = React.useCallback(async () => {
		const res = await GroupsModel.get(group_id)

		setData(res)
		await cacheGroup(res)

		return res
	}, [group_id])

	const fetchChannels = React.useCallback(async () => {
		const res = await GroupsModel.channels.list(group_id)

		setChannels(res)
		await cacheChannels(group_id, res)

		return res
	}, [group_id])

	const fetchMembers = React.useCallback(async () => {
		try {
			const res = await GroupsModel.members.list(group_id, {
				offset: lastLoadedMemberId.current,
			})

			if (res.items.length > 0) {
				lastLoadedMemberId.current = res.items[0]._id
			}

			console.log(res)

			// update cache
			setMembers(res)
			await cacheMembers(res)
			await cacheTotalMembers(group_id, res.total_items)
			await evaluateMembersConnections(res.items)

			return res
		} catch (err) {
			console.error("Error fetching more members:", err)
		}
	}, [group_id])

	const syncStatedRTCChannels = React.useCallback(async () => {
		console.debug("[rtc] gathering state")

		const state = (await GroupsModel.rtc.getGroupState(
			group_id,
		)) as StatedChannel[]

		console.debug("[rtc] gathered state:", state)

		if (Array.isArray(state)) {
			setStatedChannels(
				state.reduce((curr, channel) => {
					curr[channel._id] = channel
					return curr
				}, {}),
			)
		}

		return state
	}, [group_id])

	const evaluateMembersConnections = React.useCallback(
		async (members: Member[]) => {
			console.debug("[members] evaluating:", members)

			if (members.length === 0) return

			let missingReferences = []

			for (const member of members) {
				if (!usersConnectionsRef.has(member.user_id)) {
					missingReferences.push(member.user_id)
				}
			}

			console.debug("[members] missing refs:", missingReferences)

			const states = await GroupsModel.members.connections(
				group_id,
				missingReferences,
			)

			if (!Array.isArray(states)) return

			console.log("[members] computing ref states:", states)

			for (const memberState of states) {
				usersConnectionsRef.set(memberState.userId, memberState)

				setConnectedMembers((prev) => {
					const newState = [...prev]

					if (
						memberState.connected &&
						!newState.includes(memberState.userId)
					) {
						newState.push(memberState.userId)
					} else if (
						!memberState.connected &&
						newState.includes(memberState.userId)
					) {
						newState.filter((id) => id !== memberState.userId)
					}

					return newState
				})
			}
		},
		[group_id, setConnectedMembers, usersConnectionsRef],
	)

	const deferredCacheChecking = async (cached: CachedGroup) => {
		try {
			console.debug("[cache] checking", { cached })

			const meta = await GroupsModel.meta(group_id)

			console.debug("[cache] actual meta:", meta)

			if (cached.group?.__v < meta.group_v) {
				console.debug("[cache] group_v invalidated", {
					cached: cached.group?.__v,
					actual: meta.group_v,
				})
				await fetchGroup()
			}

			if ((cached.total_members ?? 0) < (meta.total_members ?? 0)) {
				console.debug("[cache] total_members invalidated", {
					cached: cached.total_members,
					actual: meta.total_members,
				})
				await fetchMembers()
			}

			if (
				(cached.channels?.total_items ?? 0) < (meta.total_channels ?? 0)
			) {
				console.debug("[cache] channels.total_items invalidated", {
					cached: cached.channels?.total_items,
					actual: meta.total_channels,
				})
				await fetchChannels()
			}
		} catch (err) {
			console.error("[cache] check fail:", err)
		}
	}

	const load = React.useCallback(async () => {
		setLoading(true)
		setError(null)

		let cached = {
			group: null,

			memberships: null,
			total_members: 0,

			channels: null,
		} as CachedGroup

		try {
			cached.group = await db.groups.get(group_id)

			cached.channels = await db.channels.get(group_id)

			cached.memberships = await db.members
				.where("group_id")
				.equals(group_id)
				.limit(50)
				.toArray()

			cached.total_members =
				(await db.members_counter.get(group_id)).counter ?? 0
		} catch (error) {
			console.error("Failed to get cached content", error)
		}

		console.log("useGroup::load()", {
			group_id,
			cached,
		})

		try {
			//
			// fetch the group data,
			// if the group data is not cached
			//
			if (!cached.group || !cached.group?.cached_at) {
				cached.group = await fetchGroup()
			} else {
				setData(cached.group)
			}

			//
			// fetch the members list
			// if the members list is not cached or is empty
			//
			if (!cached.memberships || cached.memberships.length === 0) {
				await fetchMembers()
			} else {
				setMembers({
					items: cached.memberships,
					total_items: cached.total_members,
				})
				await evaluateMembersConnections(cached.memberships)
			}

			//
			// fetch the channels list
			// if the channels list is not cached or is empty
			//
			if (!cached.channels || !cached.channels?.cached_at) {
				cached.channels = await fetchChannels()
			} else {
				setChannels(cached.channels)
			}
		} catch (err) {
			console.error(err)
			setError(err as Error)
		} finally {
			setLoading(false)

			//
			// check the cache
			//
      deferredCacheChecking(cached)

     	//
			// sync the stated RTC channels
			//
			await syncStatedRTCChannels()
		}
	}, [group_id, data, members, channels])

	React.useEffect(() => {
		if (error) {
			app.cores.notifications.new({
				type: "error",
				title: "Failed to load group",
				description: error.message,
			})
		}
	}, [error])

	React.useEffect(() => {
		if (!group_id) {
			return undefined
		}

		load()

		const events = buildSocketEvents({
			group_id: group_id,
			updaters: {
				setData,
				setChannels,
				setMembers,
				setStatedChannels,
				setConnectedMembers,
			},
		})

		if (socket.current) {
			socket.current.topics.subscribe("group:subscribe", group_id)

			for (const [event, handler] of Object.entries(events)) {
				console.debug(`[socket] event: ${event}`, handler)
				socket.current.on(event, handler)
			}
		}

		return () => {
			setConnectedMembers([])
			lastLoadedMemberId.current = null

			if (socket.current) {
				socket.current.topics.subscribe("group:unsubscribe", group_id)

				for (const [event, handler] of Object.entries(events)) {
					socket.current.off(event, handler)
				}
			}
		}
	}, [group_id])

	return {
		data: data as Group,
		channels: channels as Channels,
		members: members as Members,

		statedChannels: statedChannels,
		connectedMembers: connectedMembers,
		usersConnectionsRef: usersConnectionsRef,

		loading,
		error,

		load,
		fetchMembers,
		fetchChannels,
		fetchGroup,

		setChannels,
		setMembers,
		setData,

		cacheChannels,
		cacheGroup,
		cacheMembers,
	}
}

const GroupContext = React.createContext<ReturnType<typeof useGroup>>(null)

export {
	VALID_CHANNEL_KINDS,
	DEFAULT_GROUP_STATE as DEFAULT_CONTEXT_DATA,
	GroupContext,
	useGroup,
}
export default GroupContext
