export default async (core, data) => {
	core.console.debug("received client event:", data)

	switch (data.event) {
		case "updateVoiceState": {
			await core.handlers.updateClientVoiceState(data.userId, data.data)
			break
		}

		default: {
			throw new Error("Invalid event")
		}
	}
}
