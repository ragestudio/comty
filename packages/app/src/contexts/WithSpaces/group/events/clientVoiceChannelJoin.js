// update the group channel array if a client joins or leaves a channel
export default (data, setChannels, payload) => {
	setChannels((prev) => {
		const channels = prev.map((channel) => {
			// update the clients of the channel
			if (channel._id === payload.channelId) {
				channel.clients.push({
					userId: payload.userId,
					user: payload.user,
					voiceState: payload.voiceState,
					self: payload.userId === app.userData._id,
				})
			}

			return channel
		})

		return channels
	})
}
