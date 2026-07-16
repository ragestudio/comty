import React from "react"
import { Skeleton } from "antd"

import "./EmojiPicker.less"

const EmojiPicker = ({ injectChar, close }) => {
	const [emojis, setEmojis] = React.useState(null)
	const [loading, setLoading] = React.useState(true)

	const fetchEmojis = React.useCallback(async () => {
		let res = await fetch("/emojis.json")
		let data = await res.json()

		setEmojis(data.emojis)
		setLoading(false)
	}, [])

	const handleClickItem = React.useCallback(
		(emoji) => {
			if (typeof injectChar === "function") {
				injectChar(emoji)
			}

			if (typeof close === "function") {
				close()
			}
		},
		[injectChar],
	)

	React.useEffect(() => {
		fetchEmojis()
	}, [])

	if (loading) {
		return (
			<div className="emoji-picker">
				<Skeleton active />
			</div>
		)
	}

	return (
		<div className="emoji-picker">
			<div className="emoji-picker__list">
				{emojis &&
					emojis.map((emoji) => (
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

export default EmojiPicker
