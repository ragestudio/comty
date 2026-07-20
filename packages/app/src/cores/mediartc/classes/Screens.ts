import type MediaRTC from "../mediartc.core"
import Screen from "./Screen"

export default class Screens extends Map {
	constructor(core: MediaRTC) {
		if (!core) {
			throw new Error("Core not provided")
		}

		super()
		this.core = core
	}

	core: MediaRTC

	start = async (producerId: string) => {
		// get the producer
		const producer = this.core.producers.get(producerId)

		if (!producer) {
			throw new Error("Producer not found")
		}

		// create the screen
		const screen = new Screen(producer)

		// start the screen
		await screen.start()

		this.set(producer.userId, screen)

		return screen
	}

	stop = async (producerId: string) => {
		// get the producer
		const producer = this.core.producers.get(producerId)

		if (!producer) {
			throw new Error("Producer not found")
		}

		// get the screen
		const screen = this.get(producer.userId)

		if (!screen) {
			throw new Error("Screen not found")
		}

		// stop the screen
		await screen.stop()

		this.delete(producer.userId)
	}
}
