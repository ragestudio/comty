// update the group channel array if a client joins or leaves a channel
export default (data, setChannels, payload) => {
	setChannels((prev) => {
		const channels = prev.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.clients = channel.clients.filter(
					(client) => client.userId !== payload.userId,
				)
			}

			return channel
		})

		return channels
	})
}
