import React from "react"
import Icons from "@components/Icons"
import Button from "@ui/Button"
import Popover from "@ui/Popover"
import { Skeleton } from "antd"

import "./GifPicker.less"

const GifPickerDialog = () => {
	return <div></div>
}

const GifPicker = ({ onClickItem }) => {
	return (
		<Popover
			trigger="click"
			content={({ close }) => (
				<GifPickerDialog
					onClickItem={onClickItem}
					close={close}
				/>
			)}
			className="emoji-picker-popover"
		>
			<Button type="ghost">
				<Icons.ImagePlay />
			</Button>
		</Popover>
	)
}
export default GifPicker
