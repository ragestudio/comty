import React from "react"
import Slider from "@ui/Slider"

import audioRmsWorkletUrl from "@cores/mediartc/worklets/rms?worker&url"

import "./volume-gate.less"

const minDb = -60
const maxDb = 0

// helper function to convert dB to normalized value (0-1)
const dbToNormalized = (db) => {
	return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))
}

// helper function to safely convert RMS to dB using volume gate formula
const rmsToVolumeGateDb = (rmsValue) => {
	if (rmsValue <= 0) {
		return minDb // return minimum dB for zero or negative values
	}
	const power = rmsValue * rmsValue
	// volume gate uses: 10 * Math.log10(2 * envelope)
	// where envelope is the squared RMS value (power)
	const db = 10 * Math.log10(2 * power)
	return db
}

const ThresholdSlider = ({ onThresholdChange }) => {
	const [value, setValue] = React.useState(
		app.cores.mediartc.instance().self.audioSettings.volumeGateThreshold,
	)

	const apply = (value) => {
		app.cores.mediartc.instance().self.audioSettings = {
			volumeGateThreshold: value,
		}

		if (onThresholdChange) {
			onThresholdChange(value)
		}
	}

	return (
		<Slider
			style={{ width: "100%", height: "10px" }}
			min={-100}
			max={0}
			step={1}
			value={value}
			onChange={setValue}
			onChangeComplete={apply}
		/>
	)
}

const VolumeGateSettings = () => {
	const micStream = React.useRef(null)
	const audioCtx = React.useRef(null)
	const audioRmsWorklet = React.useRef(null)
	const volumeIndicator = React.useRef(null)

	const updateThresholdIndicator = (threshold) => {
		if (volumeIndicator.current) {
			const thresholdNormalized = dbToNormalized(threshold)
			volumeIndicator.current.style.setProperty(
				"--threshold",
				(thresholdNormalized * 100).toFixed(2) + "%",
			)
		}
	}

	const startAudioLoopback = async () => {
		audioCtx.current = new AudioContext({
			sampleRate: 48000,
			latencyHint: "interactive",
			//sinkId: params.sinkId,
		})
		await audioCtx.current.audioWorklet.addModule(audioRmsWorkletUrl)
		await audioCtx.current.resume()

		audioRmsWorklet.current = new AudioWorkletNode(
			audioCtx.current,
			"audio-rms",
			{
				parameterData: {
					clipLevel: 1,
					averaging: 0.9,
					clipLag: 750,
				},
			},
		)

		audioRmsWorklet.current.port.onmessage = (event) => {
			if (
				volumeIndicator.current &&
				event.data?.volume &&
				event.data?.volume?.[0]
			) {
				const volumeData = event.data.volume[0]

				// check if volumeData has the expected structure
				if (!volumeData || typeof volumeData.value === "undefined") {
					console.warn("Invalid volume data structure:", volumeData)
					return
				}

				// convert RMS value to dB using the same formula as volume gate processor
				const db = rmsToVolumeGateDb(volumeData.value)

				const normalized = dbToNormalized(db)

				// get current threshold value from audio settings
				const threshold =
					app.cores.mediartc.instance().self.audioSettings
						.volumeGateThreshold
				// normalize threshold to same 0-1 range
				const thresholdNormalized = dbToNormalized(threshold)

				volumeIndicator.current.style.setProperty(
					"--rms",
					(normalized * 100).toFixed(2) + "%",
				)
				volumeIndicator.current.style.setProperty(
					"--threshold",
					(thresholdNormalized * 100).toFixed(2) + "%",
				)
			}
		}

		const instance = app.cores.mediartc.instance()

		if (micStream.current) {
			stopAudioLoopback()
		}

		if (!instance.self.micStream) {
			await instance.self.createMicStream()
		}

		micStream.current = instance.self.micStream

		audioCtx.current
			.createMediaStreamSource(micStream.current)
			.connect(audioRmsWorklet.current)
			.connect(audioCtx.current.destination)
	}

	const stopAudioLoopback = async () => {
		if (audioCtx.current) {
			audioCtx.current.close()
		}

		const instance = app.cores.mediartc.instance()

		if (!instance.self.micProducer && instance.self.micStream) {
			instance.self.destroyMicStream()
		}
	}

	React.useEffect(() => {
		startAudioLoopback()

		updateThresholdIndicator(
			app.cores.mediartc.instance().self.audioSettings
				.volumeGateThreshold,
		)

		return () => {
			stopAudioLoopback()
		}
	}, [])

	return (
		<div className="setting-rtc-volume-gate">
			<div
				ref={volumeIndicator}
				className="setting-rtc-volume-gate__indicator"
			>
				<div className="setting-rtc-volume-gate__indicator__level" />
			</div>

			<ThresholdSlider onThresholdChange={updateThresholdIndicator} />
		</div>
	)
}

export default {
	id: "mediartc:volumeGate",
	group: "audio",
	title: "Sensitivity",
	description: "Adjust how much sound transmits the mic to the audio call",
	component: VolumeGateSettings,
}
