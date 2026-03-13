import React from "react"
import { Button, Slider } from "antd"

import WaveformStream from "@components/WaveformStream"
import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const ThresholdSlider = () => {
	const [value, setValue] = React.useState(
		app.cores.mediartc.instance().self.audioSettings.noiseGateThreshold,
	)

	const apply = (value) => {
		app.cores.mediartc.instance().self.audioSettings = {
			noiseGateThreshold: value,
		}
	}

	return (
		<Slider
			style={{ width: "100%" }}
			min={-100}
			max={0}
			step={1}
			value={value}
			onChange={setValue}
			onChangeComplete={apply}
		/>
	)
}

const NoiseGateSettings = () => {
	const rtcState = useMediaRTCState()
	const audioLoopback = React.useRef(null)

	const micStream = app.cores.mediartc.instance().self.micStream
	const audioInput = app.cores.mediartc.instance().self.audioInput

	const startAudioLoopback = () => {
		if (audioLoopback.current) {
			stopAudioLoopback()
		}

		audioLoopback.current = new Audio()
		audioLoopback.current.srcObject =
			app.cores.mediartc.instance().self.audioInput.destinationNode.stream

		audioLoopback.current.volume = 1
		audioLoopback.current.play()
	}

	const stopAudioLoopback = () => {
		if (!audioLoopback.current) {
			return false
		}
		audioLoopback.current.pause()
		audioLoopback.current.srcObject = null

		audioLoopback.current = null
	}

	const toggleMicStream = async () => {
		if (micStream) {
			await app.cores.mediartc.instance().self.destroyMicStream()
			stopAudioLoopback()
		} else {
			await app.cores.mediartc.instance().self.createMicStream()
			startAudioLoopback()
		}
	}

	React.useEffect(() => {
		return () => {
			stopAudioLoopback()
		}
	}, [])

	console.debug(rtcState)

	return (
		<div className="setting-rtcaudio-noisegate">
			{audioInput && (
				<WaveformStream
					stream={audioInput.destinationNode.stream}
					style={{ width: "100%" }}
				/>
			)}
			<ThresholdSlider />
			<Button
				type="primary"
				onClick={toggleMicStream}
			>
				{micStream ? "Stop" : "Test"}
			</Button>
		</div>
	)
}

export default NoiseGateSettings
