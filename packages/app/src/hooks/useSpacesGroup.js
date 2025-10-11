import React from "react"

import GroupsModel from "@models/groups"

export default ({ group_id }) => {
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

			// load the state
			group = await loadState(group)

			setData(group)
			setLoading(false)

			subscribeToGroupState()
		} catch (error) {
			setError(error)
			setLoading(false)
		}
	}, [group_id])

	const loadState = React.useCallback(
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

	const subscribeToGroupState = React.useCallback(() => {
		if (socket.current) {
			socket.current.on(`group:${group_id}:state:update`, onStateUpdate)

			socket.current.emit("group:subscribe_state", group_id)
		}
	}, [group_id])

	const unsubscribeFromGroupState = React.useCallback(() => {
		if (socket.current) {
			socket.current.off(`group:${group_id}:state:update`, onStateUpdate)

			socket.current.emit("group:unsubscribe_state", group_id)
		}
	}, [group_id])

	const onStateUpdate = React.useCallback(
		(data) => {
			console.debug("group state update", data)

			const { event, payload } = data

			switch (event) {
				case "client:joined":
				case "client:left": {
					setData((prev) => {
						const channels = prev.channels.map((channel) => {
							if (channel._id === payload.channelId) {
								channel.clients = payload.channelClients
							}

							return channel
						})

						return {
							...prev,
							channels: channels,
						}
					})
					break
				}
				case "user:online": {
					setData((prev) => {
						const connected_members = [...prev.connected_members]

						if (!connected_members.includes(payload.userId)) {
							connected_members.push(payload.userId)
						}

						return {
							...prev,
							connected_members: connected_members,
						}
					})
					break
				}
				case "user:offline": {
					setData((prev) => {
						let connected_members = [...prev.connected_members]

						if (connected_members.includes(payload.userId)) {
							connected_members = connected_members.filter(
								(memberId) => memberId !== payload.userId,
							)
						}

						return {
							...prev,
							connected_members: connected_members,
						}
					})

					break
				}
				default: {
					break
				}
			}
		},
		[data],
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
		load()

		return () => {
			unsubscribeFromGroupState()
		}
	}, [group_id])

	return {
		data,
		subscribeToGroupState,
		unsubscribeFromGroupState,
		loading,
		error,
		load,
	}
}
