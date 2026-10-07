import type { AudioStrategy } from "../types"

const webStrategy: AudioStrategy = {
	name: "web-media-devices",
	speakerAvailable: false,
	supports() {
		return (
			typeof navigator !== "undefined" &&
			typeof navigator.mediaDevices?.enumerateDevices === "function"
		)
	},
	async getDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices()

		return devices
			.filter(
				(device) =>
					device.kind === "audioinput" ||
					device.kind === "audiooutput",
			)
			.map((device) => {
				const isInput = device.kind === "audioinput"

				return {
					id: device.deviceId,
					kind: isInput ? ("input" as const) : ("output" as const),
					type: isInput ? "input" : "output",
					label:
						device.label ||
						(isInput ? "Microphone" : "Audio output"),
					isCurrent: false,
				}
			})
	},
}

export default webStrategy
