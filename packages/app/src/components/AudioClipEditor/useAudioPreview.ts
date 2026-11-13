import React from "react"

import { createAudioContext } from "./audio"

export const useAudioPreview = (
	buffer: AudioBuffer | null,
	start: number,
	end: number,
) => {
	const audioContextRef = React.useRef<AudioContext | null>(null)
	const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null)

	const [playing, setPlaying] = React.useState(false)

	const stopPreview = React.useCallback(() => {
		const node = sourceNodeRef.current

		if (node) {
			try {
				node.stop()
			} catch {
				// node may have already ended
			}

			node.disconnect()
			sourceNodeRef.current = null
		}

		setPlaying(false)
	}, [])

	React.useEffect(() => {
		return () => {
			stopPreview()
			audioContextRef.current?.close().catch(() => {})
			audioContextRef.current = null
		}
	}, [stopPreview])

	const playSelection = async () => {
		if (!buffer) return

		stopPreview()

		const context = audioContextRef.current ?? createAudioContext()

		audioContextRef.current = context

		if (context.state === "suspended") {
			await context.resume()
		}

		const node = context.createBufferSource()

		node.buffer = buffer
		node.connect(context.destination)
		node.onended = () => setPlaying(false)
		node.start(0, start, Math.max(0.01, end - start))

		sourceNodeRef.current = node
		setPlaying(true)
	}

	return {
		playing,
		stopPreview,
		playSelection,
	}
}

export default useAudioPreview
