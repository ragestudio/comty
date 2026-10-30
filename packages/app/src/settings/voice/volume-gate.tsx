import type { Setting } from "@/pages/settings/types"

import React from "react"
import Slider from "@ui/Slider"

import { adapter } from "@comty/spaces-sdk"
import { audioManager } from "@comty/spaces-sdk/rtc/audio"
import {
	audioProcessing,
	GATE_THRESHOLD_MAX_DB,
	GATE_THRESHOLD_MIN_DB,
} from "@comty/spaces-sdk/rtc/audio/processing"
import { getActiveMicTrack, getAudioContext } from "@comty/spaces-sdk/rtc/web"

import "./volume-gate.less"
import { Switch } from "antd"

const clampDb = (db: number) => {
	return Math.max(GATE_THRESHOLD_MIN_DB, Math.min(GATE_THRESHOLD_MAX_DB, db))
}

const dbToNormalized = (db: number) => {
	const range = GATE_THRESHOLD_MAX_DB - GATE_THRESHOLD_MIN_DB

	return ((clampDb(db) - GATE_THRESHOLD_MIN_DB) / range) * 100
}

// live level of the current microphone. reuses the active capture when in a
// call, otherwise opens a temporary stream just for the meter
function useMicLevel(deviceId?: string | null) {
	const [levelDb, setLevelDb] = React.useState(GATE_THRESHOLD_MIN_DB)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		let disposed = false
		let temporaryStream: MediaStream | null = null
		let source: MediaStreamAudioSourceNode | null = null
		let analyser: AnalyserNode | null = null
		let sink: GainNode | null = null
		let timer: ReturnType<typeof setInterval> | null = null

		const stopTemporaryStream = () => {
			if (!temporaryStream) return

			for (const track of temporaryStream.getTracks()) {
				track.stop()
			}

			temporaryStream = null
		}

		const setup = async () => {
			let track = getActiveMicTrack()

			if (track && track.readyState !== "live") {
				track = null
			}

			if (!track) {
				try {
					const constraints: MediaTrackConstraints = {
						...(adapter.audioProcessing?.getMicrophoneConstraints?.() ?? {}),
					}

					const inputDeviceId = audioManager.getState().inputDeviceId

					if (inputDeviceId) {
						constraints.deviceId = { ideal: inputDeviceId }
					}

					temporaryStream = await navigator.mediaDevices.getUserMedia({
						audio: constraints,
					})

					track = temporaryStream.getAudioTracks()[0] ?? null
				} catch (err: any) {
					if (!disposed) {
						setError(err?.message ?? "Cannot access the microphone")
					}

					return
				}
			}

			if (disposed || !track) {
				if (disposed) stopTemporaryStream()
				return
			}

			const context = getAudioContext()

			await context.resume().catch(() => {})

			if (disposed) {
				stopTemporaryStream()
				return
			}

			source = context.createMediaStreamSource(new MediaStream([track]))
			analyser = context.createAnalyser()
			sink = context.createGain()

			analyser.fftSize = 512
			analyser.smoothingTimeConstant = 0.4

			sink.gain.value = 0

			source.connect(analyser)
			analyser.connect(sink)
			sink.connect(context.destination)

			const buffer = new Float32Array(analyser.fftSize)

			timer = setInterval(() => {
				if (!analyser) return

				analyser.getFloatTimeDomainData(buffer)

				let sum = 0

				for (let i = 0; i < buffer.length; i++) {
					sum += buffer[i] * buffer[i]
				}

				const rms = Math.sqrt(sum / buffer.length)

				// the gate works after the manual input gain, mirror it in the meter
				const input = audioProcessing.getState().input
				const gainDb = input.gainMode === "manual" ? input.gainDb : 0

				if (rms <= 0) {
					setLevelDb(clampDb(GATE_THRESHOLD_MIN_DB + gainDb))
					return
				}

				setLevelDb(clampDb(20 * Math.log10(rms) + gainDb))
			}, 100)
		}

		setup()

		return () => {
			disposed = true

			if (timer) clearInterval(timer)

			try {
				source?.disconnect()
			} catch {
				// already disconnected
			}

			try {
				analyser?.disconnect()
			} catch {
				// already disconnected
			}

			try {
				sink?.disconnect()
			} catch {
				// already disconnected
			}

			if (temporaryStream) {
				stopTemporaryStream()
			}
		}
	}, [deviceId])

	return { levelDb, error }
}

const VolumeGateSettings = () => {
	const audioProcessingStore = audioProcessing.useStore()
	const audioManagerStore = audioManager.useStore()

	const currentThreshold = audioProcessingStore.input.gateThresholdDb
	const gateEnabled = audioProcessingStore.input.gateEnabled

	const [threshold, setThreshold] = React.useState(currentThreshold)

	const { levelDb, error } = useMicLevel(audioManagerStore.inputDeviceId)

	React.useEffect(() => {
		setThreshold(currentThreshold)
	}, [currentThreshold])

	const applyThreshold = (db: number) => {
		audioProcessing.setGateThresholdDb(db)
	}

	return (
		<div className="setting-rtc-volume-gate">
			<div
				className="setting-rtc-volume-gate__indicator"
				style={
					{
						"--rms": `${dbToNormalized(levelDb)}%`,
						"--threshold": `${dbToNormalized(threshold)}%`,
					} as React.CSSProperties
				}
			>
				<div className="setting-rtc-volume-gate__indicator__level" />
			</div>

			<div className="setting-rtc-volume-gate__values">
				<span>Input {Math.round(levelDb)}dB</span>
				<span>Threshold {threshold}dB</span>
			</div>

			{error && <span className="setting-rtc-volume-gate__error">{error}</span>}

			<Slider
				style={{ width: "100%", height: "10px" }}
				min={GATE_THRESHOLD_MIN_DB}
				max={GATE_THRESHOLD_MAX_DB}
				step={1}
				value={threshold}
				valueFormat={(value: number) => `${value}dB`}
				onChange={setThreshold}
				onChangeComplete={applyThreshold}
				disabled={!gateEnabled}
			/>
		</div>
	)
}

export default {
	id: "voice:gateThresholdDb",
	group: "audio",
	title: "Sensitivity",
	description: "Adjust how much sound transmits the mic to the audio call.",
	component: VolumeGateSettings,
	extraActions: [
		() => (
			<Switch
				defaultChecked={audioProcessing.getState().input.gateEnabled}
				onChange={(value) => audioProcessing.setGateEnabled(value)}
			/>
		),
	],
} as Setting
