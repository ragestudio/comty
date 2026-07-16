import React from "react"
import { Segmented, Tabs } from "antd"

import Button from "@ui/Button"
import Popover from "@ui/Popover"
import Icons from "@components/Icons"

import EmojiPicker from "./EmojiPicker"
import GifPicker from "./GifPicker"

import "./menu.less"

const TABS = {
	emoji: EmojiPicker,
	gif: GifPicker,
}

const ExpressionsMenuRender = (props) => {
	const [activeTab, setActiveTab] = React.useState(
		sessionStorage.getItem("expressions_menu-last_tab") ?? "gif",
	)

	const changeTab = (key) => {
		sessionStorage.setItem("expressions_menu-last_tab", key)
		setActiveTab(key)
	}

	return (
		<div className="expressions-menu">
			{TABS[activeTab] && React.createElement(TABS[activeTab], props)}

			<div className="expressions-menu__tabs">
				<Segmented
					options={[
						{ label: "GIF", value: "gif" },
						{ label: "Emoji", value: "emoji" },
					]}
					value={activeTab}
					onChange={changeTab}
				/>
			</div>
		</div>
	)
}

const ExpressionsMenu = (props) => {
	return (
		<Popover
			className="expressions-menu-popover"
			trigger="click"
			content={(_props) => (
				<ExpressionsMenuRender
					{...props}
					{..._props}
				/>
			)}
		>
			<Button type="ghost">
				<Icons.Sticker />
			</Button>
		</Popover>
	)
}

export default ExpressionsMenu
