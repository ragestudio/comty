declare const app: any

export const APP_CHANNELS = [
	{ label: "Stable", value: "stable" },
	{ label: "InDev", value: "indev" },
] as const

export type AppChannel = (typeof APP_CHANNELS)[number]["value"]

export const isElectron =
	typeof window !== "undefined" && "__ELECTRON__" in window

export const getChannel = async (): Promise<AppChannel> => {
	if (!isElectron) return "stable"

	const channel = await window.__ELECTRON__!.channel.get()

	return channel ?? "stable"
}

export const setChannel = async (channel: AppChannel): Promise<AppChannel> => {
	if (!isElectron) return channel

	const currentChannel = await getChannel()

	if (currentChannel === channel) return channel

	const appliedChannel = await window.__ELECTRON__!.channel.set(channel)

	if (appliedChannel !== channel) return currentChannel

	app.layout.modal.confirm({
		headerText: "Restart required",
		descriptionText: "Please restart Comty to apply changes",
		onConfirm: () => {
			window.__ELECTRON__!.restart()
		},
	})

	return appliedChannel
}
