import React from "react"
import "./index.less"

const ShareCameraOptionsDialog = ({ close }) => {
	const devices = React.use(navigator.mediaDevices.enumerateDevices())
	const videoDevices = React.useMemo(() => {
		return devices.filter((device) => device.kind === "videoinput")
	}, [])

	const onClickDevice = React.useCallback(
		(device) => {
			console.log(device)

			app.cores.mediartc.handlers().startCameraShare({
				device: device,
			})

			close()
		},
		[videoDevices],
	)

	return (
		<div className="sharecamera-options-dialog">
			{videoDevices.map((device) => {
				return (
					<div
						className="sharecamera-options-dialog-item"
						onClick={() => onClickDevice(device)}
					>
						<div className="sharecamera-options-dialog-item-name">
							{device.label === "" ? "No Name" : device.label}
						</div>
						<div className="sharecamera-options-dialog-item-id">
							{device.deviceId === "" ? "No ID" : device.deviceId}
						</div>
					</div>
				)
			})}
		</div>
	)
}

export function openDialog() {
	app.layout.modal.open(
		"sharecamera-options-dialog",
		ShareCameraOptionsDialog,
	)
}

export default ShareCameraOptionsDialog
