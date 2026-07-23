import type { MediaChannel } from ".."

export default async function (this: MediaChannel) {
	if (this.closed) {
		return null
	}

	this.closed = true

	try {
		// Close all consumers
		for (const [, consumers] of this.consumers) {
			if (Array.isArray(consumers)) {
				for (const consumer of consumers) {
					if (consumer && !consumer.closed) {
						consumer.close()
					}
				}
			}
		}

		this.consumers.clear()

		// Close all producers
		for (const [userId, userProducers] of this.producers) {
			for (const [id, producerInst] of userProducers) {
				if (
					producerInst &&
					producerInst.producer &&
					!producerInst.producer.closed
				) {
					producerInst.producer.close()
					// Ensure cleanup is called
					await producerInst.onProducerClose()
				}
			}
		}

		this.producers.clear()

		// Close router
		if (this.router && !this.router.closed) {
			this.router.close()
		}

		// Clear clients
		this.clients.clear()

		// try to self-delete from controller if is provided
		if (this.controller) {
			try {
				this.controller.instances.delete(this.channelId)
				console.log(
					`[CHANNEL:${this.channelId}] self deleted from instances pool`,
				)
			} catch (err) {
				console.error(
					`[CHANNEL:${this.channelId}] Failed to self delete from controller`,
				)
			}

			// try to self-delete from state bucket
			try {
				await this.controller.mediaChannelsStateBucket.delete(
					this.channelId,
				)

				console.log(
					`[CHANNEL:${this.channelId}] self deleted from state bucket`,
				)
			} catch (err) {
				console.error(
					`[CHANNEL:${this.channelId}] Failed to self delete from state bucket`,
				)
			}
		}

		console.info(`[CHANNEL:${this.channelId}] closed`)
		this.events.emit("closed", this)
	} catch (error) {
		console.error(`[CHANNEL:${this.channelId}] Error closing`, error)
	}
}
