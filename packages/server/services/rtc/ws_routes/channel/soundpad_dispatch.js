export default async (client, payload) => {
	let channelInstance = null

	if (payload.isDm === true) {
		channelInstance = global.userCalls.getClientChannel(client)
	} else {
		channelInstance = global.mediaChannels.getClientChannel(client)
	}

	if (!channelInstance) {
		throw new OperationError(404, "No channel available")
	}

	return await channelInstance.handleSoundpadDispatch(client, payload)
}
