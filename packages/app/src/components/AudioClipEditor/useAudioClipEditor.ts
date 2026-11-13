import React from "react"

import getErrorMessage from "@utils/getErrorMessage"

import { computePeaks, createTrimmedFile, loadAudioBuffer } from "./audio"
import { MIN_CLIP_DURATION, resolveInitialRange } from "./utils"
import useAudioPreview from "./useAudioPreview"

import type { AudioClipEditorProps, AudioClipRange } from "./types"

export type UseAudioClipEditorOptions = Pick<
	AudioClipEditorProps,
	"source" | "maxDuration" | "initialRange" | "close" | "onSave"
>

export const useAudioClipEditor = ({
	source,
	maxDuration = Number.POSITIVE_INFINITY,
	initialRange,
	close,
	onSave,
}: UseAudioClipEditorOptions) => {
	const [buffer, setBuffer] = React.useState<AudioBuffer | null>(null)
	const [peaks, setPeaks] = React.useState<number[]>([])
	const [start, setStart] = React.useState(0)
	const [end, setEnd] = React.useState(0)
	const [loading, setLoading] = React.useState(false)
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const duration = buffer?.duration ?? 0

	const preview = useAudioPreview(buffer, start, end)

	React.useEffect(() => {
		if (!source) return undefined

		let cancelled = false

		preview.stopPreview()
		setLoading(true)
		setError(null)
		setBuffer(null)
		setPeaks([])
		setStart(0)
		setEnd(0)

		loadAudioBuffer(source)
			.then((decoded) => {
				if (cancelled) return

				const range = resolveInitialRange(
					decoded.duration,
					maxDuration,
					initialRange,
				)

				setBuffer(decoded)
				setPeaks(computePeaks(decoded))
				setStart(range.start)
				setEnd(range.end)
			})
			.catch((loadError) => {
				if (cancelled) return

				setError(getErrorMessage(loadError, "Failed to load the audio"))
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [
		source,
		maxDuration,
		initialRange?.start,
		initialRange?.end,
		preview.stopPreview,
	])

	const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(event.target.value)
		const nextStart = Math.max(0, Math.min(value, end - MIN_CLIP_DURATION))

		setStart(nextStart)

		if (end - nextStart > maxDuration) {
			setEnd(Math.min(duration, nextStart + maxDuration))
		}
	}

	const handleEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(event.target.value)
		const nextEnd = Math.min(
			duration,
			Math.max(value, start + MIN_CLIP_DURATION),
		)

		setEnd(nextEnd)

		if (nextEnd - start > maxDuration) {
			setStart(Math.max(0, nextEnd - maxDuration))
		}
	}

	const handleSave = async () => {
		if (!buffer || saving) return

		if (end - start < MIN_CLIP_DURATION) {
			app.message.error("Select a longer clip")
			return
		}

		setSaving(true)

		try {
			const file = await createTrimmedFile(buffer, start, end)

			const range: AudioClipRange = {
				start,
				end,
				duration: end - start,
			}

			await onSave(file, range)

			close()
		} catch (saveError) {
			app.message.error(
				getErrorMessage(saveError, "Failed to save the clip"),
			)
		} finally {
			setSaving(false)
		}
	}

	return {
		buffer,
		peaks,
		start,
		end,
		duration,
		loading,
		saving,
		playing: preview.playing,
		error,
		stopPreview: preview.stopPreview,
		handleStartChange,
		handleEndChange,
		playSelection: preview.playSelection,
		handleSave,
	}
}

export default useAudioClipEditor
