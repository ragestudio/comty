import Client from "./Client"
import MediaRTC from "../mediartc.core"

export default class Clients extends Map<string, Client> {
	core: MediaRTC

	constructor(core: MediaRTC, data?: Iterable<readonly [string, Client]>) {
		super(data)
		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	join = async (data: any): Promise<Client> => {
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

	leave = async (userId: string): Promise<void> => {
		if (!this.has(userId)) {
			throw new Error("User not in the clients map")
		}

		const client = this.get(userId)

		if (!client) {
			return
		}

		app.cores.sfx.play("media_channel_leave")

		// dispatch onLeaveEvent
		await client.onLeave()

		this.delete(userId)

		this.core.console.debug("Client left from channel:", client)
	}

	destroyAll = async (): Promise<void> => {
		for (const client of this.values()) {
			await client.onLeave()
			this.delete(client.userId)
		}
	}
}
