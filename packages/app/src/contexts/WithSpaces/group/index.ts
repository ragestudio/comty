import React from "react"
// @ts-ignore
import GroupsModel from "@models/groups"
import buildSocketEvents from "./events"
import loadChannelsStates from "../helpers/loadChannelsStates"
import { cacheGroup, cacheChannels, cacheMembers } from "../helpers/cache"

import db from "../store"

import type { Group } from "../collections/group"
import type { Channels, StatedChannel } from "../collections/channel"
import type { Members } from "../collections/member"

const VALID_CHANNEL_KINDS = ["chat", "voice"] as const

export interface EventsUpdaters {
	setChannels: React.Dispatch<React.SetStateAction<Channels>>
	setMembers: React.Dispatch<React.SetStateAction<Members>>
	setConnectedMembers: React.Dispatch<React.SetStateAction<string[]>>
	setStatedChannels: React.Dispatch<
		React.SetStateAction<Record<string, StatedChannel>>
	>
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
	connected_members: [],
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

			// update cache
			setMembers(res)
			await cacheMembers(group_id, res)

			return res
		} catch (err) {
			console.error("Error fetching more members:", err)
		}
	}, [group_id])

	const load = React.useCallback(async () => {
		setLoading(true)
		setError(null)

		let cached = {
			group: null,
			members: null,
			channels: null,
		}

		try {
			cached.group = await db.groups.get(group_id)
			cached.channels = await db.channels.get(group_id)
			cached.members = await db.members.get(group_id)
		} catch (error) {
			console.error("Failed to get cached content", error)
		}

		console.log("useGroup::load()", {
			group_id,
			cached,
		})

		try {
			//
			// fetch the group data
			//
			if (!cached.group || !cached.group?.cached_at) {
				console.time("group.get()")
				cached.group = await fetchGroup()
				console.timeEnd("group.get()")
			} else {
				setData(cached.group)
			}

			//
			// fetch the members list
			//
			if (!cached.members || !cached.members?.cached_at) {
				console.time("members.list()")
				cached.members = await fetchMembers()
				console.timeEnd("members.list()")
			} else {
				setMembers(cached.members)
			}

			//
			// fetch the channels list
			//
			if (!cached.channels || !cached.channels?.cached_at) {
				console.time("channels.list()")
				cached.channels = await fetchChannels()
				console.timeEnd("channels.list()")
			} else {
				setChannels(cached.channels)
			}

			//
			// load group rtc state & update connected_members if available
			//
			console.time("getGroupState")
			const groupState = await GroupsModel.rtc.getGroupState(group_id)

			if (groupState?.connected_members) {
				setConnectedMembers(groupState.connected_members)
			}
			if (groupState?.channels) {
				setStatedChannels(
					(groupState.channels as unknown as StatedChannel[]).reduce(
						(curr, channel) => {
							curr[channel._id] = channel
							return curr
						},
						{},
					),
				)
			}
			console.timeEnd("getGroupState")

			//
			// load the channels states
			//
			// const _lo = await loadChannelsStates({
			// 	groupState: groupState,
			// 	channels: cached.channels,
			// })

			// cached.channels.items = _lo.items
			// setChannels(cached.channels)
		} catch (err) {
			console.error(err)
			setError(err as Error)
		} finally {
			setLoading(false)
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
		console.log("useGroup | group_id changed", group_id)

		if (!group_id) {
			return undefined
		}

		load()

		const events = buildSocketEvents({
			group_id: group_id,
			updaters: {
				setChannels,
				setMembers,
				setStatedChannels,
				setConnectedMembers,
			},
		})

		if (socket.current) {
			socket.current.topics.subscribe("group:subscribe", group_id)

			for (const [event, handler] of Object.entries(events)) {
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
		data: data,
		channels: channels,
		members: members,

		statedChannels: statedChannels,
		connectedMembers: connectedMembers,

		loading,
		error,

		load,
		fetchMembers,
		fetchChannels,
		fetchGroup,
	}
}

const GroupContext = React.createContext<Group>(DEFAULT_GROUP_STATE())

export {
	VALID_CHANNEL_KINDS,
	DEFAULT_GROUP_STATE as DEFAULT_CONTEXT_DATA,
	GroupContext,
	useGroup,
}
export default GroupContext
