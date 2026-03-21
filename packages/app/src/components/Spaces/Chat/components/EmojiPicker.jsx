import React from "react"
import Button from "@ui/Button"
import Popover from "@ui/Popover"
import { Skeleton } from "antd"

import "./EmojiPicker.less"

const EmojiPickerDialog = ({ onClickItem, close }) => {
	const [emojis, setEmojis] = React.useState()
	const [loading, setLoading] = React.useState(true)

	const fetchEmojis = React.useCallback(async () => {
		let res = await fetch("/emojis.json")
		let data = await res.json()

		setEmojis(data.emojis)
		setLoading(false)
		console.log("Loaded emojis >", data.emojis)
	}, [])

	const handleClickItem = React.useCallback(
		(emoji) => {
			if (typeof onClickItem === "function") {
				onClickItem(emoji)
			}

			if (typeof close === "function") {
				close()
			}
		},
		[onClickItem],
	)

	React.useEffect(() => {
		fetchEmojis()
	}, [])

	if (loading) {
		return <Skeleton active />
	}

	return (
		<div className="emoji-picker-dialog">
			<div className="emoji-picker-dialog__list">
				{emojis.map((emoji) => (
					<span
						key={emoji}
						onClick={() => handleClickItem(emoji)}
					>
						{emoji}
					</span>
				))}
			</div>
		</div>
	)
}

const EmojiPicker = ({ onClickItem }) => {
	return (
		<Popover
			trigger="click"
			content={({ close }) => (
				<EmojiPickerDialog
					onClickItem={onClickItem}
					close={close}
				/>
			)}
			className="emoji-picker-popover"
		>
			<Button type="ghost">🙂</Button>
		</Popover>
	)
}

export default EmojiPicker
