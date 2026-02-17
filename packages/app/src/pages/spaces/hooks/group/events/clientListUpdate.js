// update the group channel array if a client joins or leaves a channel
export default (data, setData, payload) => {
	console.log("clientListUpdate", payload)

	setData((prev) => {
		const channels = prev.channels.map((channel) => {
			if (channel._id === payload.channelId) {
				channel.clients = payload.channelClients ?? []
			}

			return channel
		})

		return {
			...prev,
			channels: channels,
		}
	})
}
