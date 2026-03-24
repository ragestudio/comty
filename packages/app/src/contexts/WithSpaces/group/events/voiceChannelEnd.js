export default (data, setChannels, payload) => {
	setChannels((prev) => {
		const channels = prev.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				if (channel.started_at) {
					delete channel.started_at
				}
			}

			return channel
		})

		return channels
	})
}
