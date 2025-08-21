export default async function (client, channelId) {
	try {
		// Validate channel access
		const { group } = await this._validateChannelAccess(
			client.userId,
			channelId,
		)

		// Cleanup existing connection
		if (client.currentMediaChannel) {
			await this.leaveClient(client)
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		// Get or create channel instance
		let channelInstance = this.instances.get(channelId)

		if (!channelInstance) {
			channelInstance = await this._createChannelInstance(
				group._id,
				channelId,
			)
			this.instances.set(channelId, channelInstance)
		}

		// Set client channel
		client.currentMediaChannel = channelId

		// Join client to channel
		const result = await channelInstance.joinClient(client)

		// try to public to MQTT
		this.dispatchGroupStateUpdate({
			groupId: channelInstance.data.group_id,
			event: "client:joined",
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

		return result
	} catch (error) {
		console.error(`Error joining client ${client.userId}:`, error)
		throw error
	}
}
