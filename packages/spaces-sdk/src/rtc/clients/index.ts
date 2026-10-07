import type { RTC } from ".."

import { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

import Client from "./client"

export class Clients extends Map<string, Client> {
	constructor(core: RTC, data?: Iterable<readonly [string, Client]>) {
		super(data)
		this.core = core
	}

	core: RTC

	async join(data: Partial<Client>): Promise<Client | null> {
		// check if userid is already in clients
		if (data.userId && this.has(data.userId)) {
			console.error("User already in the clients map")
			return null
		}

		//app.cores.sfx.play("media_channel_join")

		const client = new Client(this.core, data)

		this.set(client.userId, client)

		console.debug("Client joined to channel:", client)

		return client
	}

	async leave(userIdOrClient: string | Client): Promise<void> {
		if (
			typeof userIdOrClient !== "string" &&
			userIdOrClient instanceof Client
		) {
			userIdOrClient = userIdOrClient.userId
		}

		const client = this.get(userIdOrClient)

		if (!client) {
			return
		}

		//app.cores.sfx.play("media_channel_leave")

		// dispatch onLeaveEvent
		await client.onLeave()

		this.delete(userIdOrClient)

		console.debug("Client left from channel:", client)

		return
	}

	async restore(state: JoinChannelResult) {
		for (let client of state.clients) {
			this.set(client.userId, new Client(this.core, client))
		}

		if (state.producers && Array.isArray(state.producers)) {
			for (const producer of state.producers) {
				// if is self producer, skip
				if (producer.userId === this.core.userId) {
					continue
				}

				// add to producers
				this.core.producers.setRemote(producer)

				const client = this.get(producer.userId)

				if (client) {
					// attach current client mic
					if (producer.appData?.mediaTag === "user-mic") {
						await client.attachMic(producer)
					}
				}
			}
		}
	}

	async destroyAll(): Promise<void> {
		for (const client of this.values()) {
			await client.onLeave()
			this.delete(client.userId)
		}
	}
}

export default Clients
