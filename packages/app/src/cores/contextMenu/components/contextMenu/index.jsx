import React from "react"
import { AnimatePresence, motion } from "motion/react"

import { createIconRender } from "@components/Icons"

import "./index.less"
import classNames from "classnames"

const ContextMenu = (props) => {
	const [visible, setVisible] = React.useState(true)
	const { items = [], cords, clickedComponent, ctx } = props

	React.useEffect(() => {
		if (props.fireWhenClosing) {
			props.fireWhenClosing(() => {
				setVisible(false)
			})
		}
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
				return (
					<div
						key={index}
						className="context-menu-separator"
					/>
				)
			}

			return (
				<div
					key={index}
					onClick={() => handleItemClick(item)}
					className={classNames("item", {
						danger: item.danger,
						disabled: item.disabled,
					})}
					disabled={item.disabled}
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
				<motion.div
					id="context-menu"
					className="context-menu"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.3 }}
					transition={{ duration: 0.05, ease: "easeInOut" }}
				>
					{renderItems()}
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default ContextMenu
