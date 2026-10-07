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

		// start audio producer
		const micStream = await this.self.createStream<"mic">("mic")

		if (!micStream.stream) {
			throw new Error("mic stream not available")
		}

		const audioCodec = join.rtpCapabilities.codecs.find(
			(codec) => codec.kind === "audio",
		)

		console.log("using audio codec", audioCodec)

		const audioTrack =
			micStream.stream.getAudioTracks()[0] as unknown as MediaStreamTrack

		console.log("using audio track", audioTrack)

		await this.producers.produce({
			appData: { mediaTag: "user-mic" },
			track: audioTrack,
			codec: audioCodec,
			codecOptions: {
				opusStereo: false,
				opusDtx: true,
			},
			encodings: [
				{
					...defaults.audioEncodingParams,
					dtx: true,
				},
			],
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
