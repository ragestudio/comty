// update the group channel array if a client joins or leaves a channel
export default (data, setChannels, payload) => {
	setChannels((prev) => {
		const channels = prev.map((channel) => {
			if (channel._id === payload.channelId) {
				channel.clients = payload.channelClients ?? []
			}

			return channel
		})

		return channels
	})
}
