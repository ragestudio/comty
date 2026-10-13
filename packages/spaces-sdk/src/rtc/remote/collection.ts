import type { RTC } from ".."
import type { Producer } from "@/rtc/producers/producer"
import type { MediaRole, RemoteMedia } from "./media"

/**
 * Base collection for remote media units, one entry per user. Subclasses only
 * need to declare how their serialized state is pushed to the store.
 */
export abstract class RemoteMedias<T extends RemoteMedia> extends Map<
	string,
	T
> {
	constructor(
		core: RTC,
		create: (core: RTC, userId: string, collection: RemoteMedias<T>) => T,
	) {
		super()
		this.core = core
		this.create = create
	}

	core: RTC
	private create: (
		core: RTC,
		userId: string,
		collection: RemoteMedias<T>,
	) => T

	abstract syncState(): void

	protected ensure(userId: string): T {
		let media = this.get(userId)

		if (!media) {
			media = this.create(this.core, userId, this)
			this.set(userId, media)
		}

		return media
	}

	add(producer: Producer): T | null {
		const userId = producer.userId

		if (!userId) return null

		const media = this.ensure(userId)

		media.setProducer(producer)

		this.syncState()

		return media
	}

	async removeProducer(userId: string, role: MediaRole): Promise<void> {
		await this.get(userId)?.removeProducer(role)
	}

	async enable(userId: string): Promise<void> {
		await this.get(userId)?.enable()
	}

	async disable(userId: string): Promise<void> {
		await this.get(userId)?.disable()
	}

	async stop(userId: string): Promise<void> {
		await this.get(userId)?.destroy()
	}

	setVolume(userId: string, volume: number): void {
		this.get(userId)?.setVolume(volume)
	}

	async stopAll(): Promise<void> {
		for (const userId of Array.from(this.keys())) {
			await this.stop(userId)
		}
	}
}

export default RemoteMedias
