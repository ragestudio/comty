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

		// delete user from client list
		this.usersMap.delete(client.userId)

		// Leave channel
		await channelInstance.leaveClient(client)

		// // Cleanup empty channel
		// if (channelInstance.clients.size === 0) {
		// 	await channelInstance.close()
		// 	this.instances.delete(channelId)
		// }

		return channelInstance.channelId
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
