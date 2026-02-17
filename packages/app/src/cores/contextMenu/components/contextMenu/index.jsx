import React from "react"
import classNames from "classnames"
import { AnimatePresence, motion } from "motion/react"

import { createIconRender } from "@components/Icons"

import "./index.less"

const ContextMenu = (props) => {
	const [visible, setVisible] = React.useState(true)
	const { items = [], clickedComponent, ctx } = props

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
					<div className="item__line">
						<p className="item__line__label">{item.label}</p>

						<div className="item__line__icon">
							{createIconRender(item.icon)}
						</div>
					</div>

					{item.render && (
						<div className="item__line__render">
							{React.createElement(item.render)}
						</div>
					)}
				</div>
			)
		})
	}

	React.useEffect(() => {
		if (props.fireWhenClosing) {
			props.fireWhenClosing(() => {
				setVisible(false)
			})
		}
	}, [])

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					id="context-menu"
					className="context-menu bg-accent"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.3 }}
					transition={{ duration: 0.05, ease: "easeInOut" }}
				>
					{React.isValidElement(items) ? items : renderItems()}
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default ContextMenu
