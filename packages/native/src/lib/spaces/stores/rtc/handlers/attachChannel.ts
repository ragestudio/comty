import type { RTC } from ".."
import type { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

import Client from "../clients/client"
import defaults from "../defaults"

export async function attachChannel(this: RTC, join: JoinChannelResult) {
	try {
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

		// set all clients
		for (let client of join.clients) {
			this.clients.set(client.userId, new Client(this, client))
		}

		// create and setup transports
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

		const producer = await this.producers.produce({
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
				},
			],
		})

		// add here voice speak detection
		producer.rtpSender?.transform

		producer.observer.on("close", () => {
			this.self.micProducerId = null
			console.debug("[webrtc] Mic producer closed")
		})

		console.debug("[webrtc] Mic producer opened")
		this.self.micProducerId = producer.id

		// set state to connected & set date
		this.setState({
			state: "connected",
			connectedAt: new Date(),
		})

		// sync voice state
		this.handlers.syncVoiceState()

		console.debug("[webrtc] Channel attached successfully")
	} catch (err) {
		console.error(err)

		this.setState({
			state: "failed",
			connectedAt: null,
		})

		throw err
	}
}

export default attachChannel
