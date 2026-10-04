import type { RTC } from ".."
import type { Producer } from "../producers/producer"
import type { Consumer } from "./consumer"

class MirrorMap {
	constructor(targetMap?: Map<any, any>) {
		this._targetMap = targetMap ?? new Map()
	}

	_targetMap: Map<any, any>

	get _mirrorMap(): Map<string, Consumer> {
		// @ts-ignore
		return this.core.recvTransport?._consumers || new Map()
	}

	get size(): number {
		return this._mirrorMap.size
	}

	get(key: string): Consumer | undefined {
		return this._mirrorMap.get(key)
	}

	has(key: string): boolean {
		return this._mirrorMap.has(key)
	}

	values(): IterableIterator<Consumer> {
		return this._mirrorMap.values()
	}

	keys(): IterableIterator<string> {
		return this._mirrorMap.keys()
	}

	entries(): IterableIterator<[string, Consumer]> {
		return this._mirrorMap.entries()
	}

	forEach(
		callback: (
			value: Consumer,
			key: string,
			map: Map<string, Consumer>,
		) => void,
		thisArg?: any,
	): void {
		this._mirrorMap.forEach(callback, thisArg)
	}

	[Symbol.iterator](): IterableIterator<[string, Consumer]> {
		return this._mirrorMap[Symbol.iterator]()
	}
}

export class Consumers extends MirrorMap {
	constructor(core: RTC) {
		super() // <-- set here the map to mirror (this.core.recvTransport?._consumers)
		this.core = core
	}

	core: RTC

	async start({
		producerId,
		userId,
		kind,
		appData,
	}: Partial<Producer>): Promise<Consumer> {
		return
	}

	async stop(consumerId: string): Promise<void> {
		return
	}

	async stopByProducerId(producerId: string): Promise<void> {
		try {
			for (const consumer of this.values()) {
				if (consumer.producerId === producerId) {
					this.stop(consumer.id)
				}
			}
		} catch (error) {
			console.error("Error stopping consumers:", error)
			throw error
		}
	}

	async stopAll(): Promise<void> {
		try {
			for (const consumer of this.values()) {
				await this.stop(consumer.id)
			}
		} catch (error) {
			console.error("Error stopping all consumers:", error)
		}
	}

	findByProducerId(producerId: string): Consumer | undefined {
		for (const consumer of this.values()) {
			if (consumer.producerId === producerId) {
				return consumer
			}
		}

		return undefined
	}

	findByUserId(userId: string): Consumer[] {
		const consumers: Consumer[] = []
		for (const consumer of this.values()) {
			if (consumer.userId === userId) {
				consumers.push(consumer)
			}
		}
		return consumers
	}
}

export default Consumers
