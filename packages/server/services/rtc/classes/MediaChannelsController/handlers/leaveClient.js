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

		// Leave channel
		await channelInstance.leaveClient(client)

		// delete user from client list
		this.usersMap.delete(client.userId)

		// Notify client
		await client.emit("media:channel:leave", {
			channelId: channelId,
		})

		// Cleanup empty channel
		if (channelInstance.clients.size === 0) {
			console.log(`Closing empty channel ${channelId}`)
			await channelInstance.close()
			this.instances.delete(channelId)
		}

		// try to public to MQTT
		this.dispatchGroupStateUpdate({
			groupId: channelInstance.data.group_id,
			event: "client:left",
			payload: {
				userId: client.userId,
				channelId: channelId,
				channelClients: Array.from(channelInstance.clients).map((c) => {
					return {
						userId: c.userId,
					}
				}),
			},
		})

		console.log(`Client ${client.userId} left channel ${channelId}`)
	} catch (error) {
		console.error(`Error leaving client ${client.userId}:`, error)
	}
}
