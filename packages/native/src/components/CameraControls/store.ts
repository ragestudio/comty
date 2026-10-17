import * as z from "zustand"

export type CameraFacing = "user" | "environment"
export type CameraQuality = "360p" | "540p" | "720p" | "1080p"

export const CAMERA_RESOLUTIONS: Record<
	CameraQuality,
	{ width: number; height: number }
> = {
	"360p": { width: 640, height: 360 },
	"540p": { width: 960, height: 540 },
	"720p": { width: 1280, height: 720 },
	"1080p": { width: 1920, height: 1080 },
}

interface CameraControlsState {
	facing: CameraFacing
	quality: CameraQuality
	setFacing: (facing: CameraFacing) => void
	setQuality: (quality: CameraQuality) => void
}

export const CameraControlsStore = z.create<CameraControlsState>()((set) => ({
	facing: "user",
	quality: "720p",
	setFacing(facing) {
		set({ facing })
	},
	setQuality(quality) {
		set({ quality })
	},
}))

export const useCameraControls = () => CameraControlsStore((s) => s)

export default useCameraControls
