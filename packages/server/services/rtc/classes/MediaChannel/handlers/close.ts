import type { MediaChannel, SerializedMediaChannel } from ".."

export type CloseOptions = {
	// shared teardown closes the sfu router, drops the persisted state and
	// releases the ownership claim. a detached instance keeps them untouched
	// because another node may be serving the channel already
	shared?: boolean
}

export default async function (
	this: MediaChannel,
	{ shared = true }: CloseOptions = {},
) {
	if (this.closed) {
		return null
	}

	this.closed = true

	try {
		if (shared) {
			await closeSfuResources.call(this)
		}

		this.consumers.clear()
		this.producers.clear()
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

			if (shared) {
				await releaseSharedResources.call(this)
			}
		}

		console.info(`[CHANNEL:${this.channelId}] closed`)

		// a detached instance never owned the channel, the group must not see
		// an ended event from it
		if (shared) {
			this.events.emit("closed", this)
		}
	} catch (error) {
		console.error(`[CHANNEL:${this.channelId}] Error closing`, error)
	}
}

/** releases the media session on the sfu node */
async function closeSfuResources(this: MediaChannel) {
	// Close all consumers
	for (const [, consumers] of this.consumers) {
		if (!Array.isArray(consumers)) continue

		for (const consumer of consumers) {
			if (
				consumer &&
				typeof consumer.close === "function" &&
				!consumer.closed
			) {
				consumer.close()
			}
		}
	}

	// Close all producers
	for (const [, userProducers] of this.producers) {
		for (const [, producerInst] of userProducers) {
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

	// Close router
	if (this.router && !this.router.closed) {
		this.router.close()
	}
}

/**
 * Drops the persisted session and the ownership claim. The state is only
 * removed when it was written by this instance, otherwise the current owner
 * already replaced it.
 */
async function releaseSharedResources(this: MediaChannel) {
	const bucket = this.controller.mediaChannelsStateBucket

	if (bucket) {
		try {
			const state = await bucket.get<SerializedMediaChannel>(this.channelId)

			const ownedByUs =
				!state ||
				!state.ownership ||
				(state.ownership.controller_id === this.controller.controller_id &&
					state.ownership.epoch === this.ownershipEpoch)

			if (ownedByUs) {
				await bucket.delete(this.channelId)

				console.log(
					`[CHANNEL:${this.channelId}] self deleted from state bucket`,
				)
			}
		} catch (err) {
			console.error(
				`[CHANNEL:${this.channelId}] Failed to self delete from state bucket`,
			)
		}
	}

	try {
		await this.controller.ownership?.release(this.channelId)
	} catch (err) {
		console.error(
			`[CHANNEL:${this.channelId}] Failed to release channel ownership`,
		)
	}
}
