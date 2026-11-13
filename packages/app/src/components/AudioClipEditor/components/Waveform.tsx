import React from "react"

import { b } from "../style"

export type WaveformProps = {
	buffer: AudioBuffer
	peaks: number[]
	start: number
	end: number
}

const Waveform = ({ buffer, peaks, start, end }: WaveformProps) => {
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
	const accentColorRef = React.useRef("rgb(120, 120, 120)")

	React.useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas || peaks.length === 0) return undefined

		accentColorRef.current =
			window.getComputedStyle(canvas).color || accentColorRef.current
	}, [peaks])

	React.useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas || peaks.length === 0) return undefined

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

	return (
		<canvas
			ref={canvasRef}
			className={b.elem("waveform")}
		/>
	)
}

export default Waveform
