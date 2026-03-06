export default (_, payload, setChannels) => {
	switch (payload.event) {
		case "updateVoiceState":
			setChannels((prev) => {
				const channelIndex = prev.findIndex(
					(channel) => channel._id === payload.channelId,
				)
				const clientIndex =
					channelIndex > -1
						? prev[channelIndex].clients.findIndex(
								(client) => client.userId === payload.userId,
							)
						: -1

				if (clientIndex === -1) {
					return prev
				}

				const client = prev[channelIndex].clients[clientIndex]

				return prev.with(channelIndex, {
					...prev[channelIndex],
					clients: prev[channelIndex].clients.with(clientIndex, {
						...client,
						voiceState: { ...client.voiceState, ...payload.data },
					}),
				})
			})
			break
	}
}
