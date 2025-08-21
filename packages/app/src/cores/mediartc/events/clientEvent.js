export default async (core, data) => {
	core.console.debug("received client event:", data)

	const client = core.clients.get(data.userId)

	if (!client) {
		throw new Error("Client not found")
	}

	switch (data.event) {
		case "updateVoiceState": {
			client.updateVoiceState(data.data)
			break
		}

		default: {
			throw new Error("Invalid event")
		}
	}
}
