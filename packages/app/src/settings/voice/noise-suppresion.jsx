const handlers = () => {
	return app.cores.mediartc.handlers()
}

export default {
	id: "mediartc:noiseSuppression",
	group: "audio",
	title: "Noise Suppression",
	description: "Enable noise suppression for audio calls.",
	component: "Select",
	storaged: true,
	props: {
		options: [
			{
				value: "none",
				label: "Disabled",
			},
			{
				value: "native",
				label: "Standart",
			},
			{
				value: "rnn",
				label: "RNNoise",
			},
			{
				value: "dfn",
				label: "DeepFilterNet",
				disabled: true,
			},
		],
	},
	onUpdate: async (value) => {
		handlers().changeInputParams({ noiseSuppression: value })

		return value
	},
}
