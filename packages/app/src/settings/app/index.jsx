const isElectron = typeof window !== "undefined" && "__ELECTRON__" in window

const getChannel = () => {
	if (!isElectron) return "stable"

	return window.__ELECTRON__.channel.get()
}

const setChannel = async (channel) => {
	if (!isElectron) return channel

	const currentChannel = await getChannel()

	if (currentChannel === channel) return channel

	const appliedChannel = await window.__ELECTRON__.channel.set(channel)

	if (appliedChannel !== channel) return currentChannel

	app.layout.modal.confirm({
		headerText: "Restart required",
		descriptionText: "Please restart Comty to apply changes",
		onConfirm: () => {
			window.__ELECTRON__.restart()
		},
	})

	return channel
}

export default {
	id: "app",
	icon: "Command",
	label: "Application",
	group: "advanced",
	disabled: !isElectron,
	settings: [
		{
			id: "desktop:app_channel",
			group: "general",
			component: "Select",
			title: "App channel",
			description: "Choose the app channel to use",
			defaultValue: getChannel,
			props: {
				options: [
					{
						label: "Stable",
						value: "stable",
					},
					{
						label: "InDev",
						value: "indev",
					},
				],
			},
			onUpdate: setChannel,
		},
	],
}
