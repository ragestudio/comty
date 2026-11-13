import React from "react"
import { Button, Skeleton } from "antd"

import { Icons } from "@components/Icons"
import getErrorMessage from "@utils/getErrorMessage"
import createBem from "@/utils/createBem"

import {
	computePeaks,
	createAudioContext,
	createTrimmedFile,
	loadAudioBuffer,
} from "./audio"

import styles from "./index.module.less"

const b = createBem("audio-clip-editor", styles)

const MIN_CLIP_DURATION = 0.1

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value))

const formatTime = (seconds: number) => `${seconds.toFixed(2)}s`

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
	contentStyle?: React.CSSProperties
}

const AudioClipEditor = ({
	source,
	title = "Edit audio clip",
	maxDuration = Number.POSITIVE_INFINITY,
	initialRange,
	close,
	onSave,
}: AudioClipEditorProps) => {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
	const audioContextRef = React.useRef<AudioContext | null>(null)
	const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null)
	const accentColorRef = React.useRef("rgb(120, 120, 120)")

	const [buffer, setBuffer] = React.useState<AudioBuffer | null>(null)
	const [peaks, setPeaks] = React.useState<number[]>([])
	const [start, setStart] = React.useState(0)
	const [end, setEnd] = React.useState(0)
	const [loading, setLoading] = React.useState(false)
	const [saving, setSaving] = React.useState(false)
	const [playing, setPlaying] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const duration = buffer?.duration ?? 0

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
		if (!source) return undefined

		let cancelled = false

		stopPreview()
		setLoading(true)
		setError(null)
		setBuffer(null)
		setPeaks([])
		setStart(0)
		setEnd(0)

		loadAudioBuffer(source)
			.then((decoded) => {
				if (cancelled) return

				const maxEnd = Math.min(decoded.duration, maxDuration)
				const requestedStart = clamp(
					initialRange?.start ?? 0,
					0,
					Math.max(0, decoded.duration - MIN_CLIP_DURATION),
				)
				const requestedEnd = clamp(
					initialRange?.end ?? maxEnd,
					requestedStart + MIN_CLIP_DURATION,
					decoded.duration,
				)

				setBuffer(decoded)
				setPeaks(computePeaks(decoded))
				setStart(requestedStart)
				setEnd(Math.min(requestedEnd, requestedStart + maxDuration))
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
		stopPreview,
	])

	React.useEffect(() => {
		return () => {
			stopPreview()
			audioContextRef.current?.close().catch(() => {})
			audioContextRef.current = null
		}
	}, [stopPreview])

	React.useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas || !buffer || peaks.length === 0) return undefined

		accentColorRef.current =
			window.getComputedStyle(canvas).color || accentColorRef.current
	}, [buffer, peaks])

	React.useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas || !buffer || peaks.length === 0) return undefined

		const draw = () => {
			const width = canvas.clientWidth || 600
			const height = canvas.clientHeight || 100
			const ratio = window.devicePixelRatio || 1
			const pixelWidth = Math.floor(width * ratio)
			const pixelHeight = Math.floor(height * ratio)

			if (canvas.width !== pixelWidth) canvas.width = pixelWidth
			if (canvas.height !== pixelHeight) canvas.height = pixelHeight

			const context = canvas.getContext("2d")

			if (!context) return

			context.setTransform(ratio, 0, 0, ratio, 0, 0)
			context.clearRect(0, 0, width, height)

			const accent = accentColorRef.current
			const total = Math.max(buffer.duration, 0.001)
			const startX = (start / total) * width
			const endX = (end / total) * width

			context.fillStyle = "rgba(128, 128, 128, 0.12)"
			context.fillRect(startX, 0, Math.max(0, endX - startX), height)

			const step = width / peaks.length
			const barWidth = Math.max(1, step - 1)

			const drawBars = (insideSelection: boolean) => {
				context.beginPath()

				for (let index = 0; index < peaks.length; index++) {
					const x = index * step
					const inside = x >= startX && x <= endX

					if (inside !== insideSelection) continue

					const barHeight = Math.max(1, peaks[index] * height * 0.85)
					const y = (height - barHeight) / 2

					context.rect(x, y, barWidth, barHeight)
				}

				context.fill()
			}

			context.fillStyle = "rgba(128, 128, 128, 0.35)"
			drawBars(false)

			context.fillStyle = accent
			drawBars(true)

			context.fillRect(startX - 1, 0, 2, height)
			context.fillRect(endX - 1, 0, 2, height)
		}

		let frame = 0

		const schedule = () => {
			cancelAnimationFrame(frame)
			frame = requestAnimationFrame(draw)
		}

		schedule()

		window.addEventListener("resize", schedule)

		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener("resize", schedule)
		}
	}, [buffer, peaks, start, end])

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

	const handleSave = async () => {
		if (!buffer || saving) return

		if (end - start < MIN_CLIP_DURATION) {
			app.message.error("Select a longer clip")
			return
		}

		setSaving(true)

		try {
			const file = await createTrimmedFile(buffer, start, end)

			await onSave(file, {
				start,
				end,
				duration: end - start,
			})

			close()
		} catch (saveError) {
			app.message.error(
				getErrorMessage(saveError, "Failed to save the clip"),
			)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className={b()}>
			<div className={b.elem("header")}>
				<h2>{title}</h2>

				<Button
					type="text"
					icon={<Icons.X />}
					disabled={saving}
					onClick={close}
				/>
			</div>

			{loading && <Skeleton active />}

			{!loading && error && <p className={b.elem("error")}>{error}</p>}

			{!loading && !error && buffer && (
				<>
					<canvas
						ref={canvasRef}
						className={b.elem("waveform")}
					/>

					<div className={b.elem("ranges")}>
						<label className={b.elem("range")}>
							<span>Start</span>
							<input
								type="range"
								min={0}
								max={duration}
								step={0.01}
								value={start}
								onChange={handleStartChange}
							/>
							<strong>{formatTime(start)}</strong>
						</label>

						<label className={b.elem("range")}>
							<span>End</span>
							<input
								type="range"
								min={0}
								max={duration}
								step={0.01}
								value={end}
								onChange={handleEndChange}
							/>
							<strong>{formatTime(end)}</strong>
						</label>
					</div>

					<div className={b.elem("info")}>
						<span>Selected: {formatTime(end - start)}</span>

						{Number.isFinite(maxDuration) && (
							<span>Max: {formatTime(maxDuration)}</span>
						)}
					</div>

					<div className={b.elem("actions")}>
						<Button
							icon={playing ? <Icons.Square /> : <Icons.Play />}
							onClick={playing ? stopPreview : playSelection}
						>
							{playing ? "Stop" : "Preview"}
						</Button>

						<Button
							onClick={close}
							disabled={saving}
						>
							Cancel
						</Button>

						<Button
							type="primary"
							icon={<Icons.Save />}
							loading={saving}
							onClick={handleSave}
						>
							Save clip
						</Button>
					</div>
				</>
			)}
		</div>
	)
}

export const openAudioClipEditor = (options: OpenAudioClipEditorOptions) => {
	const { id = "audio-clip-editor", contentStyle, ...props } = options

	app.layout.modal.open(id, AudioClipEditor, {
		props: {
			...props,
			contentStyle: {
				width: "min(640px, 90vw)",
				maxWidth: "90vw",
				...contentStyle,
			},
		},
	})
}

export default AudioClipEditor
