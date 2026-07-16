import React from "react"
import * as antd from "antd"

import Button from "@ui/Button"
import { Icons } from "@components/Icons"

import "./index.less"

const HiddenText = (props) => {
	const [visible, setVisible] = React.useState(props.defaultVisible ?? false)

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
			className="hidden-text"
			style={props.style}
		>
			<Button
				icon={visible ? <Icons.Eye /> : <Icons.EyeClosed />}
				onClick={() => setVisible(!visible)}
				className="hidden-text__toggle"
			/>

			<span className="hidden-text__value">
				{visible ? props.value : "********"}
			</span>

			<Button
				icon={<Icons.Clipboard />}
				onClick={copyToClipboard}
				className="hidden-text__copy"
			/>
		</div>
	)
}

export default HiddenText
