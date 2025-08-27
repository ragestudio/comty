import loadable from "@loadable/component"

export default {
	id: "rtcaudio",
	icon: "MdVolumeUp",
	label: "RTC Audio Input/Output",
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
			id: "mediartc:input_device",
			group: "audio",
			title: "Input device",
			description: "Select the input device to use for audio calls.",
			component: "Select",
			storaged: true,
			props: (ctx) => {
				return {
					defaultValue: [ctx.inputDevices[0].deviceId],
					options: ctx.inputDevices.map((device) => {
						return {
							label: device.label,
							value: device.deviceId,
						}
					}),
				}
			},
			onUpdate: async (value) => {
				app.cores.mediartc
					.handlers()
					.changeInputParams({ deviceId: value })
				return value
			},
		},
		{
			id: "mediartc:output_device",
			group: "audio",
			title: "Output device",
			description: "Select the output device to use for audio calls.",
			component: "Select",
			storaged: true,
			props: (ctx) => {
				return {
					defaultValue: [ctx.outputDevices[0].deviceId],
					options: ctx.outputDevices.map((device) => {
						return {
							label: device.label,
							value: device.deviceId,
						}
					}),
				}
			},
			onUpdate: async (value) => {
				app.cores.mediartc
					.handlers()
					.changeOutputParams({ deviceId: value })
				return value
			},
		},
		{
			id: "mediartc:echoCancellation",
			group: "audio",
			title: "Echo Cancellation",
			description: "Enable echo cancellation for audio calls.",
			component: "Switch",
			storaged: true,
			props: {
				defaultValue: true,
			},
			onUpdate: async (value) => {
				app.cores.mediartc.instance().self.audioSettings = {
					echoCancellation: value,
				}

				return value
			},
		},
		{
			id: "mediartc:noiseSuppression",
			group: "audio",
			title: "Noise Suppression",
			description: "Enable noise suppression for audio calls.",
			component: "Switch",
			storaged: true,
			props: {
				defaultValue: true,
			},
			onUpdate: async (value) => {
				app.cores.mediartc.instance().self.audioSettings = {
					noiseSuppression: value,
				}
				return value
			},
		},
		{
			id: "mediartc:autoGainControl",
			group: "audio",
			title: "Auto Gain Control",
			description: "Enable audio automatic gain control for audio calls.",
			component: "Switch",
			storaged: true,
			props: {
				defaultValue: true,
			},
			onUpdate: async (value) => {
				app.cores.mediartc.instance().self.audioSettings = {
					autoGainControl: value,
				}

				return value
			},
		},
		{
			id: "mediartc:noiseGate",
			group: "audio",
			title: "Noise Gate",
			component: loadable(() => import("./noiseGate")),
		},
	],
}
