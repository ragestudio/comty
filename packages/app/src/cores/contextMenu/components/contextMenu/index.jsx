import React from "react"

import { createIconRender } from "@components/Icons"
import { AnimatePresence, motion } from "motion/react"

import "./index.less"

const ContextMenu = (props) => {
	const [visible, setVisible] = React.useState(true)
	const { items = [], cords, clickedComponent, ctx } = props

	async function onClose() {
		setVisible(false)
		props.unregisterOnClose(onClose)
	}

	React.useEffect(() => {
		props.registerOnClose(onClose)
	}, [])

	const handleItemClick = async (item) => {
		if (typeof item.action === "function") {
			await item.action(clickedComponent, ctx)
		}
	}

	const renderItems = () => {
		if (items.length === 0) {
			return (
				<div>
					<p>No items</p>
				</div>
			)
		}

		return items.map((item, index) => {
			if (item.type === "separator") {
				return <div key={index} className="context-menu-separator" />
			}

			return (
				<div
					key={index}
					onClick={() => handleItemClick(item)}
					className="item"
				>
					<p className="label">{item.label}</p>

					{item.description && (
						<p className="description">{item.description}</p>
					)}

					{createIconRender(item.icon)}
				</div>
			)
		})
	}

	return (
		<AnimatePresence>
			{visible && (
				<div
					className="context-menu-wrapper"
					style={{
						top: cords.y,
						left: cords.x,
					}}
				>
					<motion.div
						className="context-menu"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.3 }}
						transition={{ duration: 0.05, ease: "easeInOut" }}
					>
						{renderItems()}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	)
}

export default ContextMenu
