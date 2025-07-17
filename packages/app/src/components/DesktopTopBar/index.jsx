import React from "react"
import classnames from "classnames"
import { createIconRender } from "@components/Icons"
//const { getCurrentWindow } = window.__TAURI__.window

import "./index.less"

const items = [
	{
		icon: "IoMdClose",
		onClick: () => {
			window.ipcRenderer.send("window:close")
		},
	},
	{
		icon: "FiMinus",
		onClick: () => {
			window.ipcRenderer.send("window:minimize")
		},
	},
]

const DesktopTopBarItem = ({ item }) => {
	const { icon, onClick } = item

	return (
		<div
			className="app-desktop_topbar_wrapper__items__item"
			onClick={onClick}
		>
			{createIconRender(icon)}
		</div>
	)
}

const DesktopTopBar = (props) => {
	const [hidden, setHidden] = React.useState(false)

	React.useEffect(() => {
		const handleFullscreenChange = () => {
			setHidden(!!document.fullscreenElement)
		}

		document.addEventListener("fullscreenchange", handleFullscreenChange)

		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange)
		}
	}, [])

	return (
		<div
			className={classnames("app-desktop_topbar_wrapper", {
				["hidden"]: hidden,
			})}
			data-tauri-drag-region
		>
			<div className="app-desktop_topbar_wrapper__items">
				{items.map((item, index) => (
					<DesktopTopBarItem
						key={index}
						item={item}
					/>
				))}
			</div>
		</div>
	)
}

export default DesktopTopBar
