export interface Resolution {
	label: string
	value: string
	disabled?: boolean
}

export interface Framerate {
	label: string
	value: number
	disabled?: boolean
}

export const resolutionsList: Resolution[] = [
	{
		label: "2160p",
		value: "3840x2160",
		disabled: true,
	},
	{
		label: "1080p",
		value: "1920x1080",
	},
	{
		label: "720p",
		value: "1280x720",
	},
	{
		label: "480p",
		value: "854x480",
	},
]

export const frameratesList: Framerate[] = [
	{ label: "15 fps", value: 15 },
	{ label: "25 fps", value: 25 },
	{ label: "30 fps", value: 30 },
	{ label: "60 fps", value: 60 },
	{ label: "90 fps", value: 90, disabled: true },
]
