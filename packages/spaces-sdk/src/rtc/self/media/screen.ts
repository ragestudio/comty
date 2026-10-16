import type { Self } from ".."
import type { ProduceParams } from "@/rtc/producers"
import type { RtpCodecCapability } from "mediasoup-client/types"

import type { ScreenContentHint } from "@/rtc/self/constants"

import defaults from "@/rtc/defaults"
import Producer from "@/rtc/producers/producer"
import { SelfMedia } from "."
import { computeScreenEncoding, pickVideoCodec } from "../utils"
import { logger } from "@/rtc/self"

export interface ScreenParams {
	create?: {
		codec?: RtpCodecCapability
		resolution?: { width?: number; height?: number }
		framerate?: number
		contentHint?: ScreenContentHint
		systemAudio?: boolean
	}
}

export const Screen = (self: Self) =>
	new SelfMedia<ScreenParams>(self, {
		async onCreate(params) {
			if (!this.self.core.device) {
				throw new Error("Device not available")
			}

			const screen = await this.self.createStream<"screen">("screen", {
				resolution: params?.resolution,
				framerate: params?.framerate,
				contentHint: params?.contentHint,
				systemAudio: params?.systemAudio,
			})

			if (!screen.stream) {
				throw new Error("screen stream not available")
			}

			const localStream = screen.stream as MediaStream & {
				toURL?: () => string
			}

			this.self.core.setState({
				localScreenStreamURL:
					typeof localStream.toURL === "function"
						? localStream.toURL()
						: null,
			})

			const videoTrack =
				screen.stream.getVideoTracks()[0] as unknown as MediaStreamTrack

			const audioTrack =
				screen.stream.getAudioTracks()[0] as unknown as MediaStreamTrack

			logger.debug("screen stream", screen.stream)

			const videoCodec = pickVideoCodec(
				this.self.core.device.sendRtpCapabilities,
				params?.codec,
			)

			const audioCodec = this.self.core.rtpCapabilities.codecs?.find(
				(codec) => codec.kind === "audio",
			)

			logger.debug("using codecs", { videoCodec, audioCodec })

			if (!videoCodec) {
				throw new Error("video codec not found")
			}

			let audioProducer: Producer | undefined

			if (audioTrack && audioCodec) {
				const audioProducerParams = {
					appData: {
						mediaTag: "screen-audio" as const,
					},
					track: audioTrack,
					codec: audioCodec,
					codecOptions: {
						opusStereo: true,
						opusFec: true,
						opusDtx: false,
					},
					encodings: [{ ...defaults.screenAudioEncodingParams }],
				}

				audioProducer =
					await this.self.core.producers.produce(audioProducerParams)
			}

			const videoProducerParams: ProduceParams = {
				appData: {
					mediaTag: "screen-video",
					childrens: [],
				},
				codec: videoCodec,
				encodings: [
					computeScreenEncoding(videoTrack, params?.framerate),
				],
				track: videoTrack,
			}

			if (audioProducer && audioProducer.id) {
				videoProducerParams.appData?.childrens?.push(audioProducer.id)
			}

			const videoProducer =
				await this.self.core.producers.produce(videoProducerParams)

			this.self.core.setState({
				screenAudioProducerId: audioProducer?.id ?? null,
				screenVideoProducerId: videoProducer.id,
			})

			videoProducer.observer.on("close", () => {
				this.self.core.setState({ screenVideoProducerId: null })
			})

			audioProducer?.observer.on("close", () => {
				this.self.core.setState({ screenAudioProducerId: null })
			})

			logger.debug("scream media created")

			return { videoProducer, audioProducer, screen }
		},
		async onDestroy() {
			const { screenVideoProducerId, screenAudioProducerId } =
				this.self.core.getState()

			if (screenVideoProducerId) {
				const screenVideoProducer = this.self.core.producers.get(
					screenVideoProducerId,
				)

				screenVideoProducer?.close()
			}

			if (screenAudioProducerId) {
				const screenAudioProducer = this.self.core.producers.get(
					screenAudioProducerId,
				)

				screenAudioProducer?.close()
			}

			await this.self.deleteStreamByKind("screen")

			this.self.core.setState({ localScreenStreamURL: null })
		},
	})

export default Screen
