import React from "react"
import { Select } from "antd"
import Icons from "@components/Icons"

import "./devices.less"
//const devicesEnum = navigator.mediaDevices.enumerateDevices()

const Devices = ({ ctx }) => {
	//const devices = React.use(devicesEnum)

	const inputDevices = ctx.processedCtx.inputDevices ?? []
	const outputDevices = ctx.processedCtx.outputDevices ?? []

	const onInputDeviceChange = (value) => {
		console.log(value)

		app.cores.settings.set("mediartc:input_device", value)
		app.cores.mediartc.handlers().changeInputParams({ deviceId: value })
	}

	const onOutputDeviceChange = (value) => {
		console.log(value)

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
			</div>
		</div>
	)
}

export default Devices
