import React from "react"

const WaveformStream = ({ stream, style }) => {
	const canvasRef = React.useRef(null)
	const animationRef = React.useRef(null)
	const analyserRef = React.useRef(null)
	const dataArrayRef = React.useRef(null)

	React.useEffect(() => {
		if (!stream || !canvasRef.current) {
			return
		}

		const canvas = canvasRef.current
		const ctx = canvas.getContext("2d")

		// set canvas size
		canvas.width = 800
		canvas.height = 200

		// create audio context and analyser
		const audioContext = new AudioContext()
		const analyser = audioContext.createAnalyser()
		const source = audioContext.createMediaStreamSource(stream)

		analyser.fftSize = 2048
		analyser.smoothingTimeConstant = 0.8

		source.connect(analyser)

		const bufferLength = analyser.frequencyBinCount
		const dataArray = new Uint8Array(bufferLength)

		analyserRef.current = analyser
		dataArrayRef.current = dataArray

		const draw = () => {
			analyser.getByteTimeDomainData(dataArray)

			ctx.fillStyle = "#000"
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			ctx.lineWidth = 2
			ctx.strokeStyle = "#00ff00"
			ctx.beginPath()

			const sliceWidth = canvas.width / bufferLength
			let x = 0

			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0
				const y = (v * canvas.height) / 2

				if (i === 0) {
					ctx.moveTo(x, y)
				} else {
					ctx.lineTo(x, y)
				}

				x += sliceWidth
			}

			ctx.stroke()
			animationRef.current = requestAnimationFrame(draw)
		}

		draw()

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current)
			}
			audioContext.close()
		}
	}, [stream])

	return (
		<canvas
			style={style}
			ref={canvasRef}
		/>
	)
}

export default WaveformStream
