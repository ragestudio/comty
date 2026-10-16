export type ScreenContentHint = "motion" | "detail" | "text"

export interface ScreenOption<T> {
	label: string
	value: T
	disabled?: boolean
}

// default presets offered by the screen share dialogs, agnostic to the ui
export const SCREEN_RESOLUTIONS: ScreenOption<string>[] = [
	{ label: "2160p", value: "3840x2160", disabled: true },
	{ label: "1080p", value: "1920x1080" },
	{ label: "720p", value: "1280x720" },
	{ label: "480p", value: "854x480" },
]

export const SCREEN_FRAMERATES: ScreenOption<number>[] = [
	{ label: "15 fps", value: 15 },
	{ label: "25 fps", value: 25 },
	{ label: "30 fps", value: 30 },
	{ label: "60 fps", value: 60 },
	{ label: "90 fps", value: 90, disabled: true },
]

export const SCREEN_CONTENT_HINTS: ScreenOption<ScreenContentHint>[] = [
	{ label: "Detail", value: "detail" },
	{ label: "Motion", value: "motion" },
	{ label: "Text", value: "text" },
]

export const SCREEN_VIDEO_CODECS = [
	"video/h264",
	"video/vp9",
	"video/vp8",
	"video/av1",
]
