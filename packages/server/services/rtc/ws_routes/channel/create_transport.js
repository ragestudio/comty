export default async (client, payload) => {
	const channelInstance = global.mediaChannels.getClientChannel(client)

	if (!channelInstance) {
		throw new OperationError(404, "No channel available")
	}

	return await channelInstance.createTransport(client, payload)
}
