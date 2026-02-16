import React from "react"
import Button from "@ui/Button"

import classnames from "classnames"

import { Icons } from "@components/Icons"

import "./index.less"

export default (props) => {
	const [saved, setSaved] = React.useState(props.defaultActive)

	const onClick = async () => {
		props.onClick({
			to: !saved,
		})
		setSaved(!saved)
	}

	return (
		<Button
			type="ghost"
			className={classnames("save-button", {
				["active"]: saved,
			})}
			icon={saved ? <Icons.BookmarkCheck /> : <Icons.Bookmark />}
			onClick={onClick}
		/>
	)
}
