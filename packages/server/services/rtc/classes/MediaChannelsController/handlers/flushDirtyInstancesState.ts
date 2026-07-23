import type MediaChannelsController from ".."

export default async function (this: MediaChannelsController) {
	if (
		!this.mediaChannelsStateBucket ||
		this.isFlushing ||
		this.dirtyInstances.size === 0
	) {
		return
	}

	this.isFlushing = true

	const channelsToProcess = Array.from(this.dirtyInstances)
	this.dirtyInstances.clear()

	try {
		for (
			let i = 0;
			i < channelsToProcess.length;
			i += this.flushChunkSize
		) {
			const chunk = channelsToProcess.slice(i, i + this.flushChunkSize)

			const promises = chunk.map(async (channelId) => {
				const channelInstance = this.instances.get(channelId)

				// if the instance cannot be reached or is closed, skip it
				if (!channelInstance || channelInstance.closed) {
					return
				}

				try {
					const serializedState = channelInstance.serialize()

					console.log(
						`Flushing channel ${channelId}`,
						serializedState,
					)

					await this.mediaChannelsStateBucket.put(
						channelId,
						serializedState,
					)
				} catch (error) {
					console.error(
						`Failed to flush dirty instance ${channelId}:`,
						error,
					)

					this.dirtyInstances.add(channelId)
				}
			})

			// execute in parallel
			await Promise.allSettled(promises)

			// if there are more chunks to process, yield to the event loop to avoid blocking
			if (i + this.flushChunkSize < channelsToProcess.length) {
				await new Promise((resolve) => setImmediate(resolve))
			}
		}
	} finally {
		this.isFlushing = false
	}
}
