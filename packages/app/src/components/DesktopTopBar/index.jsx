import React from "react"
import classnames from "classnames"
import { createIconRender } from "@components/Icons"

import "./index.less"

const useDocumentTitle = () => {
	const observer = React.useRef(null)
	const [title, setTitle] = React.useState(document.title)

	React.useEffect(() => {
		observer.current = new MutationObserver(() => {
			setTitle(document.title)
		})

		observer.current.observe(document.querySelector("title"), {
			childList: true,
		})

		return () => {
			observer.current.disconnect()
		}
	}, [])

	return title
}

const items = [
	{
		icon: "X",
		onClick: () => {
			window.ipcRenderer.invoke("window:close")
		},
	},
	{
		icon: "Minus",
		onClick: () => {
			window.ipcRenderer.invoke("window:minimize")
		},
	},
]

const DesktopTopBarItem = ({ item }) => {
	const { icon, onClick } = item

	return (
		<div
			className="app-desktop_topbar_wrapper__content__items__item"
			onClick={onClick}
		>
			{createIconRender(icon)}
		</div>
	)
}

const DesktopTopBar = (props) => {
	const [hidden, setHidden] = React.useState(false)
	const title = useDocumentTitle()

	React.useEffect(() => {
		const handleFullscreenChange = () => {
			setHidden(!!document.fullscreenElement)
		}

		document.addEventListener("fullscreenchange", handleFullscreenChange)

		return () => {
			document.removeEventListener(
				"fullscreenchange",
				handleFullscreenChange,
			)
		}
	}, [])

	return (
		<div
			className={classnames("app-desktop_topbar_wrapper", {
				["hidden"]: hidden,
			})}
			data-tauri-drag-region
		>
			<div className="app-desktop_topbar_wrapper__content">
				<div className="app-desktop_topbar_wrapper__content__title">
					<span>{title}</span>
				</div>

				<div className="app-desktop_topbar_wrapper__content__items">
					{items.map((item, index) => (
						<DesktopTopBarItem
							key={index}
							item={item}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

export default DesktopTopBar
