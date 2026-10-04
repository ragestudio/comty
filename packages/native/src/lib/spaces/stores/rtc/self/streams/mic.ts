import BaseStream, { type BaseHandlerParams } from "./base"
import { mediaDevices } from "react-native-webrtc"
import InCallManager from "react-native-incall-manager"

interface MicStreamParams extends BaseHandlerParams {
	start: { force?: boolean; deviceId?: string }
	close: { force?: boolean; reason?: string }
}

export const MicStream = () =>
	new BaseStream<MicStreamParams>({
		async onStart(params) {
			this.stream = await mediaDevices.getUserMedia({
				video: false,
				audio: true,
			})

			console.log(`[micStream] created stream:`, this.stream)

			// InCallManager.start({ media: "audio" })
			// InCallManager.setForceSpeakerphoneOn(true)

			return this.stream
		},
		async onClose() {
			//InCallManager.stop()
		},
	})

export default MicStream
