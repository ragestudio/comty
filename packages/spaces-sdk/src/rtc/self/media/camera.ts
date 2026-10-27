import type { Self } from ".."
import type { RtpCodecCapability } from "mediasoup-client/types"

import { SelfMedia } from "."
import defaults from "@/rtc/defaults"
import { getMediaStreamURL } from "@/utils/mediaStreamURL"
import { pickVideoCodec } from "../utils"
import { logger } from "@/rtc/self"

export interface CameraParams {
	create?: {
		codec?: RtpCodecCapability
		deviceId?: string
		facingMode?: "user" | "environment"
		resolution?: { width?: number; height?: number }
	}
}

export const Camera = (self: Self) =>
	new SelfMedia<CameraParams>(self, {
		async onCreate(params) {
			if (!this.self.core.device) {
				throw new Error("Device not available")
			}

			const cam = await this.self.createStream<"cam">("cam", {
				deviceId: params?.deviceId,
				facingMode: params?.facingMode,
				resolution: params?.resolution,
			})

			if (!cam.stream) {
				throw new Error("camera stream not available")
			}

			this.self.core.setState({
				localCameraStreamURL: getMediaStreamURL(cam.stream),
				localCameraStream: cam.stream,
			})

			const videoTrack =
				cam.stream.getVideoTracks()[0] as unknown as MediaStreamTrack

			if (!videoTrack) {
				throw new Error("video track not found")
			}

			// the device may end the track (unplugged camera, revoked permission)
			videoTrack.addEventListener(
				"ended",
				() => {
					this.self.destroyMedia("cam").catch((error) => {
						logger.error("failed to destroy camera media", error)
					})
				},
				{ once: true },
			)

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
				encodings: [{ ...defaults.cameraVideoEncodingParams }],
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

			logger.debug("camera media created")

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

			this.self.core.setState({
				localCameraStreamURL: null,
				localCameraStream: null,
			})
		},
	})

export default Camera
