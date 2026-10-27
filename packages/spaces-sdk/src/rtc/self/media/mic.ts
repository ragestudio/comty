import type { Self } from ".."

import { SelfMedia } from "."
import defaults from "@/rtc/defaults"
import { logger } from "@/rtc/self"

export const Microphone = (self: Self) =>
	new SelfMedia(self, {
		async onCreate() {
			if (!this.self.core) {
				throw new Error("Device not available")
			}

			const mic = await this.self.createStream<"mic">("mic")

			if (!mic.stream) {
				throw new Error("mic stream not available")
			}

			const audioTrack =
				mic.stream.getAudioTracks()[0] as unknown as MediaStreamTrack

			const audioCodec = this.self.core.rtpCapabilities.codecs?.find(
				(codec) => codec.kind === "audio",
			)

			if (!audioCodec) {
				throw new Error("audio codec not found")
			}

			logger.debug("using audio codec", audioCodec)

			const producer = await this.self.core.producers.produce(
				{
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
				},
				{
					onSpeaking: (isSpeaking) => {
						this.self.core.setState({ isSpeaking })
					},
				},
			)

			// set the mic producer id
			this.self.core.setState({ micProducerId: producer.id })

			// when the mic producer is closed
			producer.observer.on("close", () => {
				this.self.core.setState({ micProducerId: null })
				this.self.core.setState({ isSpeaking: false })
			})

			logger.debug("mic media created")

			return { mic, producer }
		},
		async onDestroy() {
			const { micProducerId } = this.self.core.getState()

			if (micProducerId) {
				const micProducer = this.self.core.producers.get(micProducerId)
				micProducer?.close()
			}

			// stop the microphone capture, otherwise the device keeps recording
			await this.self.deleteStreamByKind("mic")
		},
	})

export default Microphone
