export default {
	id: "notifications",
	icon: "Bell",
	label: "Notifications",
	group: "basic",
	settings: [
		{
			id: "sfx:notifications_feedback",
			storaged: true,
			group: "notifications",
			component: "Switch",
			icon: "BellRing",
			title: "Notifications Sound",
			description: "Play a sound when a notification is received.",
		},
		{
			id: "haptics:notifications_vibrate",
			storaged: true,
			group: "notifications",
			component: "Switch",
			icon: "Vibrate",
			title: "Vibration",
			description: "Vibrate the device when a notification is received.",
			desktop: false,
		},
		{
			id: "sfx:notifications_volume",
			storaged: true,
			group: "notifications",
			component: "Slider",
			icon: "Volume2",
			title: "Volume",
			description:
				"Set the volume of the sound when a notification is received.",
			props: {
				tipFormatter: (value) => {
					return `${value}%`
				},
			},
			mobile: false,
		},
	],
}
