import React from "react"
import { Select } from "antd"
import Slider from "@ui/Slider"
import Icons from "@components/Icons"

import "./devices.less"

const gainPercentageFormat = (value) =>
	`${Number(parseFloat(value) * 100).toFixed(0)}%`

const Devices = ({ ctx }) => {
	const inputDevices = ctx.processedCtx.inputDevices ?? []
	const outputDevices = ctx.processedCtx.outputDevices ?? []

	const onInputGainChange = (value) => {
		app.cores.mediartc.instance().self.audioSettings = { inputGain: value }
	}

	const onOutputGainChange = (value) => {
		app.cores.mediartc.instance().self.audioSettings = { outputGain: value }
	}

	const onInputDeviceChange = (value) => {
		app.cores.settings.set("mediartc:input_device", value)
		app.cores.mediartc.handlers().changeInputParams({ deviceId: value })
	}

	const onOutputDeviceChange = (value) => {
		app.cores.settings.set("mediartc:output_device", value)
		app.cores.mediartc.handlers().changeOutputParams({ deviceId: value })
	}

	console.debug({
		ctx,
		inputDevices,
		outputDevices,
	})

	return (
		<div className="mediartc-voice-devices">
			<div className="mediartc-voice-devices__select">
				<span>
					<Icons.Mic /> Mic
				</span>

				<Select
					onSelect={onInputDeviceChange}
					options={inputDevices.map((item) => {
						return {
							label: item.label,
							value: item.deviceId,
						}
					})}
					defaultValue={
						app.cores.settings.get("mediartc:input_device") ??
						inputDevices[0].deviceId
					}
				/>
				<Slider
					defaultValue={parseFloat(
						app.cores.settings.get("mediartc:inputGain"),
					)}
					valueFormat={gainPercentageFormat}
					onChange={onInputGainChange}
					min={0.1}
					max={3.0}
					step={0.1}
				/>
			</div>
			<div className="mediartc-voice-devices__select">
				<span>
					<Icons.Headphones /> Headphones
				</span>

				<Select
					onSelect={onOutputDeviceChange}
					options={outputDevices.map((item) => {
						return {
							label: item.label,
							value: item.deviceId,
						}
					})}
					defaultValue={
						app.cores.settings.get("mediartc:output_device") ??
						outputDevices[0].deviceId
					}
				/>
				<Slider
					defaultValue={parseFloat(
						app.cores.settings.get("mediartc:outputGain"),
					)}
					valueFormat={gainPercentageFormat}
					onChange={onOutputGainChange}
					min={0.1}
					max={3.0}
					step={0.1}
				/>
			</div>
		</div>
	)
}

export default Devices
