export default class Screen {
	constructor(producer) {
		this.producer = producer
		this.media = new MediaStream()
	}

	get rtc() {
		return app.cores.mediartc.instance()
	}

	consumersIds = []

	start = async () => {
		await this.appendFromProducer(this.producer.id)

		// handle childrens producers
		if (
			this.producer.appData &&
			Array.isArray(this.producer.appData.childrens)
		) {
			for (const childProducerId of this.producer.appData.childrens) {
				await this.appendFromProducer(childProducerId)
			}
		}
	}

	stop = async () => {
		if (this.media) {
			// stop the tracks
			this.media.getTracks().forEach((track) => track.stop())
		}

		// stop all consumers
		for (const consumerId of this.consumersIds) {
			await this.rtc.consumers.stop(consumerId)
		}

		// if the screens map stills having this screen, remove it
		if (this.rtc.screens.has(this.producer.id)) {
			this.rtc.screens.delete(this.producer.id)
		}
	}

	appendFromProducer = async (producer_id) => {
		const producer = this.rtc.producers.get(producer_id)

		if (!producer) {
			console.warn("Producer not found", producer_id)
			return null
		}

		// try to get the consumer
		let consumer = this.rtc.consumers.findByProducerId(producer.id)

		// if not found, start a new consumer
		if (!consumer) {
			console.log("Starting new consumer", { producer })
			consumer = await this.rtc.consumers.start(producer)
		}

		if (!consumer) {
			throw new Error("Cannot consume from the producer")
		}

		// if consumer is paused, resume it
		if (consumer.paused) {
			await consumer.resume()
		}

		// add to the consumer the events when the consumer is ended
		consumer.observer.on("close", this.stop)
		consumer.observer.on("trackended", this.stop)

		// add the track
		this.media.addTrack(consumer.track)

		// add the id
		this.consumersIds.push(consumer.id)

		return consumer
	}
}
