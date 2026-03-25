import loadable from "@loadable/component"

import NoiseSuppresionSetting from "./noise-suppresion"
import VolumeGateSetting from "./volume-gate"

export default {
	id: "voice",
	icon: "Podcast",
	label: "Voice",
	group: "app",
	ctxData: async () => {
		const devices = await navigator.mediaDevices.enumerateDevices()

		const inputDevices = devices.filter(
			(device) => device.kind === "audioinput",
		)
		const outputDevices = devices.filter(
			(device) => device.kind === "audiooutput",
		)

		return {
			inputDevices,
			outputDevices,
		}
	},
	settings: [
		{
			id: "mediartc:devices",
			component: loadable(() => import("./devices")),
			title: "Devices",
		},
		VolumeGateSetting,
		NoiseSuppresionSetting,
		{
			id: "mediartc:echoCancellation",
			group: "audio",
			title: "Echo Cancellation",
			description: "Enable echo cancellation for audio calls",
			component: "Switch",
			storaged: true,
			props: {
				defaultValue: true,
			},
			onUpdate: async (value) => {
				app.cores.mediartc
					.handlers()
					.changeInputParams({ echoCancellation: value })
				return value
			},
		},
		{
			id: "mediartc:autoGain",
			group: "audio",
			title: "Automatic Gain Control",
			description:
				"Automatically adjust the microphone volume to maintain a consistent volume",
			component: "Switch",
			storaged: true,
			props: {
				defaultValue: true,
			},
			onUpdate: async (value) => {
				app.cores.mediartc
					.handlers()
					.changeInputParams({ autoGainControl: value })
				return value
			},
		},
	],
}
