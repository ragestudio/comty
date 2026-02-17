import React from "react"
import GroupsModel from "@models/groups"

import onClientListUpdateEvent from "./events/clientListUpdate"
import onUserOnlineEvent from "./events/userOnline"
import onUserOfflineEvent from "./events/userOffline"

const useGroup = ({ group_id }) => {
	if (!group_id) {
		throw new Error("group_id is required")
	}

	const socket = React.useRef(app.cores.api.socket())

	const [data, setData] = React.useState(null)
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState(null)

	const load = React.useCallback(async () => {
		try {
			setError(null)
			setLoading(true)
			setData(null)

			// load base data
			let group = await GroupsModel.get(group_id)

			// list all channels
			group.channels = await GroupsModel.channels.list(group._id)

			// add clients array to each channel
			group.channels = group.channels.map((channel) => {
				return {
					...channel,
					clients: [],
				}
			})

			// load the channels state
			group = await loadChannelsStates(group)

			setData(group)
			setLoading(false)

			subscribeToGroupState()
		} catch (error) {
			setError(error)
			setLoading(false)
		}
	}, [group_id])

	const loadChannelsStates = React.useCallback(
		async (group) => {
			// load the current states
			const state = await GroupsModel.rtc.getGroupState(group._id)

			// override with current channels state
			if (Array.isArray(state.channels)) {
				for (let channel of group.channels) {
					const currentStateChannel = state.channels.find(
						(_c) => _c._id === channel._id,
					)

					if (currentStateChannel && currentStateChannel.clients) {
						channel.clients = currentStateChannel.clients
					}
				}
			}

			// override with current connected members state
			if (state.connected_members) {
				group.connected_members = state.connected_members
			}

			return group
		},
		[group_id],
	)

	const groupTopicEvents = React.useMemo(() => {
		return {
			"client:joined": (payload) =>
				onClientListUpdateEvent(data, setData, payload),
			"client:left": (payload) =>
				onClientListUpdateEvent(data, setData, payload),
			"user:online": (payload) =>
				onUserOnlineEvent(data, setData, payload),
			"user:offline": (payload) =>
				onUserOfflineEvent(data, setData, payload),
		}
	}, [group_id])

	const subscribeToGroupState = React.useCallback(() => {
		if (socket.current) {
			socket.current.emit("group:subscribe", group_id)

			for (let eventKey of Object.keys(groupTopicEvents)) {
				socket.current.on(
					`group:${group_id}:${eventKey}`,
					groupTopicEvents[eventKey],
				)
			}
		}
	}, [group_id])

	const unsubscribeFromGroupState = React.useCallback(() => {
		if (socket.current) {
			socket.current.emit("group:unsubscribe", group_id)

			for (let eventKey of Object.keys(groupTopicEvents)) {
				socket.current.off(
					`group:${group_id}:${eventKey}`,
					groupTopicEvents[eventKey],
				)
			}
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
		load()

		return () => {
			unsubscribeFromGroupState()
		}
	}, [group_id])

	return {
		data: data,
		loading: loading,
		error: error,
		load: load,
		unsubscribeFromGroupState: unsubscribeFromGroupState,
		subscribeToGroupState: subscribeToGroupState,
	}
}

export default useGroup
