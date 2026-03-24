export default (data, setChannels, payload) => {
	setChannels((prev) => {
		const channels = prev.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				if (payload.started_at) {
					channel.started_at = payload.started_at
				}
			}

			return channel
		})

		return channels
	})
}
