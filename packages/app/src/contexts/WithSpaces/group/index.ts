import React from "react"
// @ts-ignore
import GroupsModel from "@models/groups"
import buildSocketEvents from "./events"
import { cacheGroup, cacheChannels, cacheMembers } from "../helpers/cache"

import type { Group } from "../collections/group"
import type { Channels, StatedChannel } from "../collections/channel"
import type { Member, Members } from "../collections/member"

import { useGroupData } from "./hooks/useGroupData"
import { useGroupChannels } from "./hooks/useGroupChannels"
import { useGroupMembers } from "./hooks/useGroupMembers"
import { useRTCChannels } from "./hooks/useRTCChannels"
import { useMembersConnections } from "./hooks/useMembersConnections"
import { useMembersDecorations } from "./hooks/useMembersDecorations"
import { useGroupLoad } from "./hooks/useGroupLoad"

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

export type { UserConnectionReference } from "./hooks/useMembersConnections"
export type { CachedGroup } from "./hooks/useGroupLoad"

const useGroup = ({ group_id }: { group_id: string }) => {
	if (!group_id) {
		throw new Error("group_id is required")
	}

	const socket = React.useRef((app as any).cores.api.socket())

	const { data, setData, fetchGroup } = useGroupData(group_id)
	const { channels, setChannels, fetchChannels } = useGroupChannels(group_id)

	const {
		connectedMembers,
		setConnectedMembers,
		usersConnectionsRef,
		evaluateMembersConnections,
	} = useMembersConnections(group_id)
	const {
		membersDecorations,
		setMembersDecorations,
		fetchedDecorationsRef,
		evaluateMembersDecorations,
	} = useMembersDecorations()

	const { members, setMembers, fetchMembers, lastLoadedMemberId } =
		useGroupMembers(
			group_id,
			evaluateMembersConnections,
			evaluateMembersDecorations,
		)
	const { statedChannels, setStatedChannels, syncStatedRTCChannels } =
		useRTCChannels(group_id)

	const { loading, error, load } = useGroupLoad({
		group_id,
		fetchGroup,
		setData,
		fetchMembers,
		setMembers,
		evaluateMembersConnections,
		evaluateMembersDecorations,
		fetchChannels,
		setChannels,
		syncStatedRTCChannels,
	})

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
			setMembersDecorations({})
			fetchedDecorationsRef.current.clear()
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

		membersDecorations: membersDecorations,
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
