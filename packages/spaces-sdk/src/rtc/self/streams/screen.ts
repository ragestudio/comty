import type { Self } from ".."
import type { ScreenContentHint } from "@/rtc/self/constants"
import type { BaseHandlerParams } from "./base"

import BaseStream from "./base"
import { logger } from "@/rtc/self"

export interface ScreenStreamParams extends BaseHandlerParams {
	start: {
		force?: boolean
		resolution?: { width?: number; height?: number }
		framerate?: number
		systemAudio?: boolean
		contentHint?: ScreenContentHint
	}
	close: { force?: boolean; reason?: string }
}

export const ScreenStream = (self: Self) =>
	new BaseStream<ScreenStreamParams>(self, "screen", {
		async onStart(params) {
			this.stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { max: params?.resolution?.width ?? 1920 },
					height: { max: params?.resolution?.height ?? 1080 },
					frameRate: { max: params?.framerate ?? 30 },
				},
				// browsers only expose tab or system audio when an audio track is
				// requested, the desktop app can also request it this way
				audio: !!params?.systemAudio,
			})

			const [videoTrack] = this.stream.getVideoTracks()

			// hint the encoder about the kind of content being shared
			if (videoTrack && params?.contentHint) {
				videoTrack.contentHint = params.contentHint
			}

			logger.log(`created stream:`, this.stream)

			return this.stream
		},

		async onClose() {
			if (this.stream) {
				for (const track of this.stream.getTracks()) {
					if (!track.stop) continue
					track.stop()
				}

				if (typeof this.stream.release === "function") {
					this.stream.release(true)
				}
			}
		},
	})

export default ScreenStream
