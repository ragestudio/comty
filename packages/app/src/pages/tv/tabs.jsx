import LivestreamsList from "./tabs/livestreamsList"

export default [
	{
		key: "live",
		label: "Livestreams",
		icon: "Radio",
		component: LivestreamsList,
	},
	{
		key: "videos",
		label: "Videos",
		icon: "SquarePlay",
		component: LivestreamsList,
		disabled: true,
	},
]
