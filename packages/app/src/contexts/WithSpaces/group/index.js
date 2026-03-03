import React from "react"
import GroupsModel from "@models/groups"

import onClientListUpdateEvent from "./events/clientListUpdate"
import onUserOnlineEvent from "./events/userOnline"
import onUserOfflineEvent from "./events/userOffline"

const VALID_CHANNEL_KINDS = ["chat", "voice"]

const getInitialMembersState = () => ({
	total: 0,
	hasMore: false,
	list: [],
})

const DEFAULT_CHANNELS_STATE = []

const DEFAULT_CONTEXT_DATA = {
	_id: null,
	name: null,
	description: null,
	cover: null,
	owner_user_id: null,
	groupCoverImageAverageColor: null,
	channels: [],
	connected_members: [],
	members: {},
}

const useGroup = ({ group_id }) => {
	if (!group_id) {
		throw new Error("group_id is required")
	}

	const socket = React.useRef(app.cores.api.socket())

	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState(null)

	const [data, setData] = React.useState(null)
	const [members, setMembers] = React.useState(getInitialMembersState)
	const [channels, setChannels] = React.useState(DEFAULT_CHANNELS_STATE)
	const [connectedMembers, setConnectedMembers] = React.useState([])

	const lastLoadedMemberId = React.useRef(null)

	const dataRef = React.useRef(data)

	React.useEffect(() => {
		dataRef.current = data
	}, [data])

	const fetchMembers = React.useCallback(async () => {
		try {
			const result = await GroupsModel.members.list(group_id, {
				offset: lastLoadedMemberId.current,
			})

			if (result.items.length > 0) {
				lastLoadedMemberId.current = result.items[0]._id
			}

			setMembers((prev) => ({
				list: [...prev.list, ...result.items],
				total: result.total_items,
				hasMore: result.has_more,
			}))
		} catch (err) {
			console.error("Error fetching more members:", err)
		}
	}, [group_id])

	const loadChannelsStates = React.useCallback(
		async (channelsList, currentGroupId) => {
			const remoteState =
				await GroupsModel.rtc.getGroupState(currentGroupId)

			if (Array.isArray(remoteState.channels)) {
				for (let channel of channelsList) {
					const currentStateChannel = remoteState.channels.find(
						(_c) => _c._id === channel._id,
					)

					if (currentStateChannel && currentStateChannel.clients) {
						channel.clients = currentStateChannel.clients
					}
				}
			}

			if (remoteState.connected_members) {
				setConnectedMembers(remoteState.connected_members)
			}

			return channelsList
		},
		[],
	)

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

		const loadInitialData = async () => {
			setLoading(true)
			setError(null)
			setData(null)
			setMembers(getInitialMembersState())
			setChannels(DEFAULT_CHANNELS_STATE)
			setConnectedMembers([])
			lastLoadedMemberId.current = null

			try {
				const group = await GroupsModel.get(group_id)

				if (!isActive) {
					return null
				}

				const membersResult = await GroupsModel.members.list(group_id, {
					offset: null,
				})

				if (!isActive) {
					return null
				}

				if (membersResult.items.length > 0) {
					lastLoadedMemberId.current = membersResult.items[0]._id
				}

				setMembers({
					list: membersResult.items,
					total: membersResult.total_items,
					hasMore: membersResult.has_more,
				})

				let channelsList = await GroupsModel.channels.list(group._id)

				if (!isActive) {
					return null
				}

				channelsList = channelsList.map((channel) => ({
					...channel,
					clients: [],
				}))
				channelsList = await loadChannelsStates(channelsList, group_id)

				if (!isActive) {
					return null
				}

				setData(group)
				setChannels(channelsList)
			} catch (err) {
				if (isActive) {
					setError(err)
				}
			} finally {
				if (isActive) {
					setLoading(false)
				}
			}
		}

		loadInitialData()

		const handleClientUpdate = (payload) =>
			onClientListUpdateEvent(dataRef.current, setChannels, payload)
		const handleUserOnline = (payload) =>
			onUserOnlineEvent(dataRef.current, setConnectedMembers, payload)
		const handleUserOffline = (payload) =>
			onUserOfflineEvent(dataRef.current, setConnectedMembers, payload)

		if (socket.current) {
			socket.current.emit("group:subscribe", group_id)
			socket.current.on(
				`group:${group_id}:client:joined`,
				handleClientUpdate,
			)
			socket.current.on(
				`group:${group_id}:client:left`,
				handleClientUpdate,
			)
			socket.current.on(`group:${group_id}:user:online`, handleUserOnline)
			socket.current.on(
				`group:${group_id}:user:offline`,
				handleUserOffline,
			)
		}

		return () => {
			isActive = false

			if (socket.current) {
				socket.current.emit("group:unsubscribe", group_id)
				socket.current.off(
					`group:${group_id}:client:joined`,
					handleClientUpdate,
				)
				socket.current.off(
					`group:${group_id}:client:left`,
					handleClientUpdate,
				)
				socket.current.off(
					`group:${group_id}:user:online`,
					handleUserOnline,
				)
				socket.current.off(
					`group:${group_id}:user:offline`,
					handleUserOffline,
				)
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

const GroupContext = React.createContext(DEFAULT_CONTEXT_DATA)

export { VALID_CHANNEL_KINDS, DEFAULT_CONTEXT_DATA, GroupContext, useGroup }
export default GroupContext
