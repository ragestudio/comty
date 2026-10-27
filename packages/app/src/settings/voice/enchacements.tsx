import { audioProcessing } from "@comty/spaces-sdk/rtc/audio/processing"

export const EchoCancelation = {
	id: "voice:echoCancellation",
	group: "audio",
	title: "Echo Cancellation",
	description: "Remove the echo picked by the microphone from the speakers.",
	component: "Switch",
	defaultValue: () => audioProcessing.getState().input.echoCancellation,
	onUpdate: async (value) => {
		await audioProcessing.setEchoCancellation(value)

		return value
	},
}

export const AutoGain = {
	id: "voice:autoGain",
	group: "audio",
	title: "Automatic Gain Control",
	description:
		"Let the browser adjust the microphone volume to keep a consistent level.",
	component: "Switch",
	defaultValue: () => audioProcessing.getState().input.gainMode === "auto",
	onUpdate: async (value) => {
		await audioProcessing.setGainMode(value ? "auto" : "manual")

		return value
	},
}

export default [AutoGain, EchoCancelation]
