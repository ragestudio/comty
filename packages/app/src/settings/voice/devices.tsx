import React from "react"
import { Select } from "antd"
import Button from "@ui/Button"
import Slider from "@ui/Slider"
import Icons from "@components/Icons"

import { audioManager } from "@comty/spaces-sdk/rtc/audio"
import {
	audioProcessing,
	GAIN_MAX_DB,
	GAIN_MIN_DB,
} from "@comty/spaces-sdk/rtc/audio/processing"

import "./devices.less"

const gainDbFormat = (value: number) => `${value}dB`

const Devices = () => {
	const audioManagerStore = audioManager.useStore()
	const audioProcessingStore = audioProcessing.useStore()

	const [inputGain, setInputGain] = React.useState(
		audioProcessingStore.input.gainDb,
	)
	const [outputGain, setOutputGain] = React.useState(
		audioProcessingStore.output.gainDb,
	)

	const inputDevices =
		audioManagerStore.devices.filter((device) => device.kind === "input") ?? []
	const outputDevices =
		audioManagerStore.devices.filter((device) => device.kind === "output") ?? []

	const manualGain = audioProcessingStore.input.gainMode === "manual"

	React.useEffect(() => {
		audioManager.refresh()
	}, [])

	// keep the sliders in sync when the value changes outside this view
	React.useEffect(() => {
		setInputGain(audioProcessingStore.input.gainDb)
	}, [audioProcessingStore.input.gainDb])

	React.useEffect(() => {
		setOutputGain(audioProcessingStore.output.gainDb)
	}, [audioProcessingStore.output.gainDb])

	const onInputDeviceChange = async (deviceId: string) => {
		await audioManager.setInputDevice(deviceId)
	}

	const onOutputDeviceChange = async (deviceId: string) => {
		await audioManager.setOutputDevice(deviceId)
	}

	const applyInputGain = async (db: number) => {
		await audioProcessing.setInputGainDb(db)
	}

	const applyOutputGain = async (db: number) => {
		await audioProcessing.setOutputGainDb(db)
	}

	return (
		<div className="mediartc-voice-devices">
			<div className="mediartc-voice-devices__select">
				<span>
					<Icons.Mic /> Mic
				</span>

				<Select
					value={audioManagerStore.inputDeviceId ?? undefined}
					onChange={onInputDeviceChange}
					placeholder="Default microphone"
					options={inputDevices.map((item) => {
						return {
							label: item.label,
							value: item.id,
						}
					})}
				/>
				<Slider
					value={inputGain}
					valueFormat={gainDbFormat}
					onChange={setInputGain}
					onChangeComplete={applyInputGain}
					min={GAIN_MIN_DB}
					max={GAIN_MAX_DB}
					step={1}
					disabled={!manualGain}
				/>
			</div>

			<div className="mediartc-voice-devices__select">
				<span>
					<Icons.Headphones /> Headphones
				</span>

				<Select
					value={audioManagerStore.outputDeviceId ?? undefined}
					onChange={onOutputDeviceChange}
					placeholder="Default output"
					options={outputDevices.map((item) => {
						return {
							label: item.label,
							value: item.id,
						}
					})}
				/>
				<Slider
					value={outputGain}
					valueFormat={gainDbFormat}
					onChange={setOutputGain}
					onChangeComplete={applyOutputGain}
					min={GAIN_MIN_DB}
					max={GAIN_MAX_DB}
					step={1}
				/>
			</div>

			<div className="mediartc-voice-devices__actions">
				<Button
					icon={<Icons.RefreshCw size={16} />}
					onClick={() => audioManager.refresh()}
				>
					Refresh
				</Button>
			</div>
		</div>
	)
}

export default {
	id: "voice:devices",
	group: "audio",
	title: null,
	component: Devices,
}
