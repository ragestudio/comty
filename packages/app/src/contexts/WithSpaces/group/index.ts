import React from "react"
// @ts-ignore
import GroupsModel from "@models/groups"
import buildSocketEvents from "./events"
import loadChannelsStates from "../helpers/loadChannelsStates"

import { useLiveQuery } from "dexie-react-hooks"
import db from "../store"

import type { Group } from "../collections/group"
import type { StatedChannels } from "../collections/channel"
import type { Members } from "../collections/member"

const VALID_CHANNEL_KINDS = ["chat", "voice"] as const

export interface EventsUpdaters {
	setChannels: React.Dispatch<React.SetStateAction<StatedChannels>>
	setMembers: React.Dispatch<React.SetStateAction<Members>>
	setConnectedMembers: React.Dispatch<React.SetStateAction<string[]>>
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

	const [data, setData] = React.useState<Group | null>(DEFAULT_GROUP_STATE())
	const [members, setMembers] = React.useState<Members>(
		DEFAULT_MEMBERS_STATE(),
	)
	const [channels, setChannels] = React.useState<StatedChannels>(
		DEFAULT_CHANNELS_STATE(),
	)

	const [connectedMembers, setConnectedMembers] = React.useState<string[]>([])

	const lastLoadedMemberId = React.useRef<string | null>(null)
	const dataRef = React.useRef<Group | null>(data)

	// synchronize data with ref
	React.useEffect(() => {
		dataRef.current = data
	}, [data])

	const fetchMembers = React.useCallback(async (): Promise<void> => {
		try {
			const result = await GroupsModel.members.list(group_id, {
				offset: lastLoadedMemberId.current,
			})

			if (result.items.length > 0) {
				lastLoadedMemberId.current = result.items[0]._id
			}

			setMembers((prev) => ({
				items: [...prev.items, ...result.items],
				total_items: result.total_items,
				has_more: result.has_more,
			}))
		} catch (err) {
			console.error("Error fetching more members:", err)
		}
	}, [group_id])

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

		let isActive = true

		const loadInitialData = async (): Promise<void> => {
			setLoading(true)
			setError(null)
			setData(null)
			setMembers(DEFAULT_MEMBERS_STATE())
			setChannels(DEFAULT_CHANNELS_STATE())
			setConnectedMembers([])
			lastLoadedMemberId.current = null

			try {
				//
				// fetch the group data
				//
				const group = await GroupsModel.get(group_id)

				if (!isActive) {
					return
				}

				setData(group)

				//
				// load group rtc state & update connected_members if available
				//
				const groupState = await GroupsModel.rtc.getGroupState(group_id)

				if (!isActive) {
					return
				}

				if (groupState?.connected_members) {
					setConnectedMembers(groupState.connected_members)
				}

				//
				// fetch the members list
				//
				const membersResult = await GroupsModel.members.list(group_id, {
					offset: null,
				})

				if (!isActive) {
					return
				}

				if (membersResult.items.length > 0) {
					lastLoadedMemberId.current = membersResult.items[0]._id
				}

				setMembers({
					items: membersResult.items,
					total_items: membersResult.total_items,
					has_more: membersResult.has_more,
				})

				//
				// fetch the channels list
				//
				let channelsList = await GroupsModel.channels.list(group._id)

				if (!isActive) {
					return
				}

				//
				// load the channels states
				//
				const statedChannels = await loadChannelsStates({
					groupState: groupState,
					channels: channelsList,
				})

				if (!isActive) {
					return
				}

				channelsList.items = statedChannels.items
				setChannels(channelsList)
			} catch (err) {
				if (isActive) {
					setError(err as Error)
				}
			} finally {
				if (isActive) {
					setLoading(false)
				}
			}
		}

		loadInitialData()

		const events = buildSocketEvents({
			group_id: group_id,
			group_data_ref: dataRef,
			updaters: {
				setChannels,
				setMembers,
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
			isActive = false

			if (socket.current) {
				socket.current.topics.subscribe("group:unsubscribe", group_id)

				for (const [event, handler] of Object.entries(events)) {
					socket.current.off(event, handler)
				}
			}
		}
	}, [group_id, loadChannelsStates])

	return {
		data,
		channels,
		members,
		connectedMembers,
		loading,
		error,
		fetchMembers,
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
