import type { RTC } from "@/rtc"

export default async function (this: RTC, data: any) {
	this.logger.debug("disconnected from channel:", data)

	// ignore stale events from a channel that was already replaced
	if (
		this.channel &&
		data?.channelId &&
		this.channel._id !== data.channelId
	) {
		return
	}

	// the server removed us from the channel, so stop capturing and release
	// every local resource. leaving explicitly already resets before this event
	if (this.channel) {
		try {
			await this.handlers.reset()
		} catch (error) {
			this.logger.error("Error resetting rtc after disconnect:", error)
		}
	}

	this.eventBus.emit("rtc:channel:disconnected", data)
}
