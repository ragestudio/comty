export default class UserCalls {
	constructor(server) {
		this.server = server
	}

	async dispatch(client, payload = {}) {
		const { userId } = payload

		if (!client) {
			throw new OperationError(400, "Missing rte client")
		}

		if (!userId) {
			throw new OperationError(400, "Missing userId")
		}

		console.log("calling user", userId)

		// try to emit event to the user
		const targetClients =
			await this.server.engine.ws.find.clientsByUserId(userId)

		for (const targetClient of targetClients) {
			await targetClient.emit("call:incoming", {
				userId: client.userId,
				alternativeSfx: payload.alternativeSfx,
			})
		}

		// create a new media channel for only this two users

		return {
			userId: userId,
			alternativeSfx: payload.alternativeSfx,
		}
	}

	async initialize() {}
}
