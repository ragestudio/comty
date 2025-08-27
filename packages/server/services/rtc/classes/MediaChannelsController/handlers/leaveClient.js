export default async function (client) {
	try {
		if (!client.currentMediaChannel) {
			this.cleanupOrphanedResources(client)
			return
		}

		const channelId = client.currentMediaChannel

		const channelInstance = this.instances.get(channelId)

		if (!channelInstance) {
			client.currentMediaChannel = null
			this.cleanupOrphanedResources(client)
			return
		}

		// Leave channel
		await channelInstance.leaveClient(client)

		// Reset client state
		client.currentMediaChannel = null

		// Notify client
		await client.emit("media:channel:leave", { channelId })

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
