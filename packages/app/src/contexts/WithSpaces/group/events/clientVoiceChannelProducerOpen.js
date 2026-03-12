// update the group channel array if a client joins or leaves a channel
export default (data, setChannels, payload) => {
	setChannels((prev) => {
		const channels = prev.map((channel) => {
			if (!channel.producers) {
				channel.producers = []
			}
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.producers.push(payload.producer)
			}

			return channel
		})

		return channels
	})
}
