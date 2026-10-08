import type { Self } from ".."
import type { RtpCodecCapability } from "mediasoup-client/types"

import { SelfMedia } from "."
import defaults from "@/rtc/defaults"
import { pickVideoCodec } from "../utils"

export interface CameraParams {
	create?: {
		codec?: RtpCodecCapability
	}
}

export const Camera = (self: Self) =>
	new SelfMedia<CameraParams>(self, {
		async onCreate(params) {
			if (!this.self.core.device) {
				throw new Error("Device not available")
			}

			const cam = await this.self.createStream<"cam">("cam")

			if (!cam.stream) {
				throw new Error("mic stream not available")
			}

			const localStream = cam.stream as MediaStream & {
				toURL?: () => string
			}

			this.self.core.setState({
				localCameraStreamURL:
					typeof localStream.toURL === "function"
						? localStream.toURL()
						: null,
			})

			const videoTrack =
				cam.stream.getVideoTracks()[0] as unknown as MediaStreamTrack

			if (!videoTrack) {
				throw new Error("video track not found")
			}

			const videoCodec = pickVideoCodec(
				this.self.core.device.sendRtpCapabilities,
				params?.codec,
			)

			if (!videoCodec) {
				throw new Error("video codec not found")
			}

			const cameraProducer = await this.self.core.producers.produce({
				track: videoTrack,
				codec: videoCodec,
				appData: {
					mediaTag: "user-cam",
				},
			})

			this.self.core.setState({
				cameraProducerId: cameraProducer?.id ?? null,
			})

			cameraProducer.observer.on("close", () => {
				this.self.core.setState({ cameraProducerId: null })
			})

			return { cameraProducer, cam }
		},
		async onDestroy() {
			const { cameraProducerId } = this.self.core.getState()

			if (cameraProducerId) {
				const cameraProducer =
					this.self.core.producers.get(cameraProducerId)

				cameraProducer?.close()
			}

			await this.self.deleteStreamByKind("cam")

			this.self.core.setState({ localCameraStreamURL: null })
		},
	})

export default Camera
