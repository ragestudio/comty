export default async function (client) {
	try {
		const currentUserMediaChannel = this.usersMap.get(client.userId)

		if (!currentUserMediaChannel) {
			return
		}

		const channelInstance = this.instances.get(currentUserMediaChannel)

		if (!channelInstance) {
			return
		}

		const channelId = channelInstance.channelId

		// delete user from client list
		this.usersMap.delete(client.userId)

		// Cleanup empty channel
		if (channelInstance.clients.size === 0) {
			await channelInstance.close()
			this.instances.delete(channelId)
		}

		// Leave channel
		return await channelInstance.leaveClient(client)
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
