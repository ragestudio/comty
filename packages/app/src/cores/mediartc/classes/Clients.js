import Client from "./Client"

export default class Clients extends Map {
	constructor(core, data) {
		super(data)
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	join = async (data) => {
		// check if userid is already in clients
		if (this.has(data.userId)) {
			throw new Error("User already in the clients map")
		}

		app.cores.sfx.play("media_channel_join")

		const client = new Client(this.core, data)

		this.set(client.userId, client)

		this.core.console.debug("Client joined to channel:", client)

		return client
	}

	leave = async (userId) => {
		if (!this.has(userId)) {
			throw new Error("User not in the clients map")
		}

		const client = this.get(userId)

		app.cores.sfx.play("media_channel_leave")

		// dispatch onLeaveEvent
		await client.onLeave()

		this.delete(userId)

		this.core.console.debug("Client left from channel:", client)
	}

	destroyAll = async () => {
		for await (const client of this.values()) {
			await client.onLeave()
			this.delete(client.userId)
		}
	}
}
