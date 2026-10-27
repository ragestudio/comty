import type { RTC } from ".."

import { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

import Client from "./client"
import logger from "@/utils/logger"

export class Clients extends Map<string, Client> {
	constructor(core: RTC, data?: Iterable<readonly [string, Client]>) {
		super(data)
		this.core = core
	}

	core: RTC

	async join(data: Partial<Client>): Promise<Client | null> {
		// reconnections and duplicated events must not drop the client, update
		// the existing instance instead
		const existingClient = data.userId ? this.get(data.userId) : undefined

		if (existingClient) {
			if (data.voiceState) {
				existingClient.updateVoiceState(data.voiceState)
			}

			return existingClient
		}

		//app.cores.sfx.play("media_channel_join")

		const client = new Client(this.core, data)

		this.set(client.userId, client)

		logger.debug("Client joined to channel:", client)

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

		logger.debug("Client left from channel:", client)

		return
	}

	async restore(state: JoinChannelResult) {
		for (const client of state.clients) {
			const existingClient = this.get(client.userId)

			if (existingClient) {
				if (client.voiceState) {
					existingClient.updateVoiceState(client.voiceState)
				}

				continue
			}

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
			}

			// attach mics first, creating the client on demand so a missing entry
			// in the restored state does not skip the speaking detection
			for (const producer of state.producers) {
				if (producer.userId === this.core.userId) continue
				if (producer.appData?.mediaTag !== "user-mic") continue

				const client =
					this.get(producer.userId) ??
					(await this.join({ userId: producer.userId }))

				if (!client) continue

				await client.attachMic(producer)
			}

			for (const producer of state.producers) {
				if (producer.userId === this.core.userId) continue

				if (producer.appData?.mediaTag === "user-cam") {
					this.core.cameras.add(producer)
				}
			}

			for (const producer of state.producers) {
				if (producer.userId === this.core.userId) continue

				if (producer.appData?.mediaTag === "screen-video") {
					this.core.screens.add(producer)
				}
			}

			for (const producer of state.producers) {
				if (producer.userId === this.core.userId) continue

				if (producer.appData?.mediaTag === "screen-audio") {
					this.core.screens.add(producer)
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
