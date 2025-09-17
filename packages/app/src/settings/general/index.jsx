import config from "@config"

export default {
	id: "general",
	icon: "Command",
	label: "General",
	group: "app",
	order: 0,
	settings: [
		{
			id: "app:language",
			storaged: true,
			group: "general",
			component: "Select",
			icon: "Languages",
			title: "Language",
			description: "Choose a language for the application",
			props: {
				options: config.i18n.languages.map((language) => {
					return {
						label: language.name,
						value: language.locale,
					}
				}),
			},
			emitEvent: "app:language_changes",
		},
		{
			id: "app:lpm",
			group: "general",
			component: "Switch",
			icon: "Gauge",
			title: "Low performance mode",
			description:
				"Enable low performance mode disabling all the animations and secondary features, boosting the app performance.",
			emitEvent: "app:lpm_changed",
			props: {
				disabled: true,
			},
			storaged: true,
			experimental: true,
			disabled: true,
		},
		{
			id: "clear_internal_storage",
			group: "general",
			component: "Button",
			icon: "Eraser",
			title: "Clear internal storage",
			description:
				"Clear all the data stored in the internal storage, including your current session. It will not affect the data stored in the cloud.",
			props: {
				danger: true,
				children: "Clear",
				onClick: () => app.maintenance.clearInternalStorage(),
			},
			noUpdate: true,
		},
		{
			id: "sidebar.collapse_delay_time",
			group: "sidebar",
			component: "Slider",
			icon: "Hourglass",
			title: "Auto Collapse timeout",
			description: "Set the delay before the sidebar is collapsed",
			props: {
				min: 0,
				max: 2000,
				step: 100,
				marks: {
					0: "0s",
					600: "0.6s",
					1000: "1s",
					1500: "1.5s",
					2000: "2s",
				},
			},
			storaged: true,
			mobile: false,
		},
	],
}
