import React from "react"
import * as antd from "antd"

import { IoMdClipboard, IoMdEye, IoMdEyeOff } from "react-icons/io"

const HiddenText = (props) => {
	const [visible, setVisible] = React.useState(false)

	function copyToClipboard() {
		try {
			navigator.clipboard.writeText(props.value)
			antd.message.success("Copied to clipboard")
		} catch (error) {
			console.error(error)
			antd.message.error("Failed to copy to clipboard")
		}
	}

	return (
		<div
			style={{
				width: "50%",
				position: "relative",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: "10px",
				padding: "5px 30px",
				backgroundColor: "var(--background-color-primary)",
				borderRadius: "8px",
				fontFamily: "DM Mono, monospace",
				fontSize: "0.8rem",
				...props.style,
			}}
		>
			<span>{visible ? props.value : "********"}</span>

			<antd.Button
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					paddingTop: "0.5px",
				}}
				icon={visible ? <IoMdEye /> : <IoMdEyeOff />}
				type="ghost"
				size="small"
				onClick={() => setVisible(!visible)}
			/>

			<antd.Button
				style={{
					position: "absolute",
					right: 0,
					top: 0,
					paddingTop: "2.5px",
				}}
				icon={<IoMdClipboard />}
				type="ghost"
				size="small"
				onClick={copyToClipboard}
			/>
		</div>
	)
}

export default HiddenText
