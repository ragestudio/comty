import * as z from "zustand"
import { Dimensions, PixelRatio } from "react-native"

export type ScreenShareQuality = "480p" | "720p" | "1080p" | "source"

// target size for the short side of the capture, so portrait phone screens
// keep a usable width instead of scaling by the long side
export const SCREEN_SHARE_SIZES: Record<
	Exclude<ScreenShareQuality, "source">,
	number
> = {
	"480p": 480,
	"720p": 720,
	"1080p": 1080,
}

export const SCREEN_SHARE_FRAMERATES = [15, 24, 30]

const getDisplaySize = () => {
	const { width, height } = Dimensions.get("screen")
	// dimensions are reported in density independent pixels
	const density = PixelRatio.get()

	return {
		width: Math.round(width * density),
		height: Math.round(height * density),
	}
}

// the screen capturer only understands a fraction of the display and media
// codec rejects odd resolutions, so look for the closest scale with even sides
export const getScreenShareSize = (quality: ScreenShareQuality) => {
	const display = getDisplaySize()
	const shortSide = Math.min(display.width, display.height)
	const target = quality === "source" ? shortSide : SCREEN_SHARE_SIZES[quality]
	const baseScale = Math.min(1, target / shortSide)

	for (let step = 0; step < 2000; step++) {
		const scale = Math.min(1, baseScale + step * 0.0001)
		const width = Math.floor(display.width * scale)
		const height = Math.floor(display.height * scale)

		if (width % 2 === 0 && height % 2 === 0) {
			return { width, height, scale }
		}
	}

	return {
		width: display.width - (display.width % 2),
		height: display.height - (display.height % 2),
		scale: 1,
	}
}

interface ScreenShareControlsState {
	quality: ScreenShareQuality
	framerate: number
	setQuality: (quality: ScreenShareQuality) => void
	setFramerate: (framerate: number) => void
}

export const ScreenShareControlsStore = z.create<ScreenShareControlsState>()(
	(set) => ({
		quality: "720p",
		framerate: 30,
		setQuality(quality) {
			set({ quality })
		},
		setFramerate(framerate) {
			set({ framerate })
		},
	}),
)

export const useScreenShareControls = () => ScreenShareControlsStore((s) => s)

export default useScreenShareControls
