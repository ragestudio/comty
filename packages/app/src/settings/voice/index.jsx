import loadable from "@loadable/component"

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
		{
			id: "mediartc:echoCancellation",
			group: "audio",
			icon: "Nfc",
			title: "Echo Cancellation",
			description: "Enable echo cancellation for audio calls.",
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
			id: "mediartc:noiseSuppression",
			group: "audio",
			icon: "Activity",
			title: "Noise Suppression",
			description: "Enable noise suppression for audio calls.",
			component: "Switch",
			storaged: true,
			props: {
				defaultValue: true,
			},
			onUpdate: async (value) => {
				app.cores.mediartc
					.handlers()
					.changeInputParams({ noiseSuppression: value })
				return value
			},
		},
		{
			id: "mediartc:audioGainControl",
			group: "audio",
			icon: "Waves",
			title: "Audio Gain Control",
			description: "Enable audio gain control for audio calls.",
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
		{
			id: "mediartc:noiseGate",
			group: "audio",
			icon: "MicVocal",
			title: "Noise Gate",
			component: loadable(() => import("./noiseGate")),
		},
	],
}
