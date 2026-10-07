import type { RTC } from ".."
import type { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

import Client from "../clients/client"
import defaults from "../defaults"

export async function attachChannel(this: RTC, join: JoinChannelResult) {
	try {
		if (!this.channel) {
			throw new Error("Channel not available")
		}

		if (!join.rtpCapabilities) {
			throw new Error("Server did not provide any capabilities")
		}

		if (
			!join.rtpCapabilities.codecs ||
			!Array.isArray(join.rtpCapabilities.codecs)
		) {
			throw new Error("Server did not provide any codecs")
		}

		// store rtp capabilities for use in future producers
		this.rtpCapabilities = join.rtpCapabilities

		if (this.isConnected) {
			// if already joined, do local cleanup only
			const errors = await this.handlers.reset()

			if (errors && errors.length > 0) {
				throw new Error(errors.join(", "))
			}
		}

		// create and setup transports before restoring the channel, since
		// restoring a remote mic needs the device and the recv transport
		await this.transports.createAll()

		// dispatch user microphone
		await this.handlers.dispatchMedia({
			type: "mic",
		})

		// set state to connected & set date
		this.setState({
			state: "connected",
			connectedAt: new Date(),
		})

		// restore clients and attach remote producers
		await this.clients.restore(join)

		// sync voice state
		this.handlers.syncVoiceState()

		this.eventBus.emit("channel:attached", this.channel)
		console.debug("[webrtc] Channel attached successfully")
	} catch (err: any) {
		console.error(err)
		console.error(err.stack)

		this.setState({
			state: "failed",
			connectedAt: null,
		})

		throw err
	}
}

export default attachChannel
