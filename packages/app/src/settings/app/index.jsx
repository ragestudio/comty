export default {
	id: "app",
	icon: "FiCommand",
	label: "Application",
	group: "advanced",
	disabled: !app.isDesktop,
	settings: [
		{
			id: "desktop:app_channel",
			storaged: true,
			group: "general",
			component: "Select",
			title: "App channel",
			description: "Choose the app channel to use",
			defaultValue: () => {
				return app.cores.settings.get("desktop:app_channel")
			},
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
			onUpdate: () => {
				app.layout.modal.confirm({
					headerText: "Restart required",
					descriptionText: "Please restart Comty to apply changes",
					onConfirm: () => {
						window.__ELECTRON__.restart()
					},
				})
			},
		},
	],
}
