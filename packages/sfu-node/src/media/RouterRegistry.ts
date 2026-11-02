import type { WebRtcServer, Worker } from "mediasoup/types"
import type {
	NotifyFn,
	RouterSessionOptions,
	RouterTransportOptions,
} from "./RouterSession"

import { RouterSession } from "./RouterSession"

export class RouterRegistry {
	private routers = new Map<string, RouterSession>()

	constructor(
		private readonly worker: Worker,
		private readonly rtcServer: WebRtcServer,
		private readonly notify: NotifyFn,
		private readonly transportOptions: RouterTransportOptions,
	) {}

	async create(options: RouterSessionOptions): Promise<RouterSession> {
		if (options.channelId) {
			const existing = this.findByChannel(options.channelId)

			if (existing) {
				if (!existing.isClosed) return existing

				this.routers.delete(existing.id)
			}
		}

		const session = await RouterSession.create(
			this.worker,
			this.rtcServer,
			options,
			this.notify,
			this.transportOptions,
		)

		this.routers.set(session.id, session)

		return session
	}

	findById(id: string): RouterSession | undefined {
		const session = this.routers.get(id)

		if (!session || session.isClosed) return undefined

		return session
	}

	get(id: string): RouterSession {
		const session = this.findById(id)

		if (!session) {
			this.routers.delete(id)
			throw new OperationError(404, `Router [${id}] not found`)
		}

		return session
	}

	findByChannel(channelId: string): RouterSession | undefined {
		for (const session of this.routers.values()) {
			if (session.isClosed) continue
			if (session.appData.channelId === channelId) {
				return session
			}
		}

		return undefined
	}

	findByTransport(id: string): RouterSession | undefined {
		for (const session of this.routers.values()) {
			if (session.isClosed) continue
			if (session.hasTransport(id)) return session
		}

		return undefined
	}

	findByProducer(id: string): RouterSession | undefined {
		for (const session of this.routers.values()) {
			if (session.isClosed) continue
			if (session.hasProducer(id)) return session
		}

		return undefined
	}

	findByConsumer(id: string): RouterSession | undefined {
		for (const session of this.routers.values()) {
			if (session.isClosed) continue
			if (session.hasConsumer(id)) return session
		}

		return undefined
	}

	list() {
		return [...this.routers.values()]
			.filter((session) => !session.isClosed)
			.map((session) => ({
				id: session.id,
				channelId: session.appData.channelId,
				groupId: session.appData.groupId,
			}))
	}

	async close(id: string): Promise<boolean> {
		const session = this.routers.get(id)

		if (!session) return false

		await session.close()
		this.routers.delete(id)

		return true
	}

	async closeAll(): Promise<void> {
		for (const [id, session] of [...this.routers]) {
			await session.close()
			this.routers.delete(id)
		}
	}
}

export default RouterRegistry
