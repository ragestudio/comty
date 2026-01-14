import Screen from "./Screen"

export default class Screens extends Map {
	constructor(core) {
		super()

		this.core = core

		if (!core) {
			throw new Error("Core not provided")
		}
	}

	start = async (producerId) => {
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

	stop = async (producerId) => {
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
