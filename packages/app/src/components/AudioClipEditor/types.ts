import type { CSSProperties } from "react"

export type AudioClipRange = {
	start: number
	end: number
	duration: number
}

export type AudioClipEditorProps = {
	source: File | string
	title?: string
	maxDuration?: number
	initialRange?: Partial<Pick<AudioClipRange, "start" | "end">>
	close: () => void
	onSave: (file: File, range: AudioClipRange) => void | Promise<void>
}

export type OpenAudioClipEditorOptions = Omit<AudioClipEditorProps, "close"> & {
	id?: string
	contentStyle?: CSSProperties
}
