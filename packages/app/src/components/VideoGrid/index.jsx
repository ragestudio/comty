import React from "react"
import PropTypes from "prop-types"
import { motion, AnimatePresence } from "motion/react"
import classnames from "classnames"

import "./index.less"

const VideoGrid = ({ children, focusedId, className, ...props }) => {
	const videoItems = React.Children.toArray(children)
	const itemCount = videoItems.length

	// calculate grid layout based on item count
	const getGridLayout = (count) => {
		if (count === 0) return { cols: 1, rows: 1 }
		if (count === 1) return { cols: 1, rows: 1 }
		if (count === 2) return { cols: 2, rows: 1 }
		if (count <= 4) return { cols: 2, rows: 2 }
		if (count <= 6) return { cols: 3, rows: 2 }
		if (count <= 9) return { cols: 3, rows: 3 }
		if (count <= 12) return { cols: 4, rows: 3 }
		if (count <= 16) return { cols: 4, rows: 4 }

		return { cols: 4, rows: Math.ceil(count / 4) }
	}

	const { cols, rows } = getGridLayout(itemCount)
	const hasFocusedItem = focusedId !== null

	// split items into focused and others
	const focusedItem = hasFocusedItem
		? videoItems.find((child) => child.props?.consumer?.id === focusedId)
		: null
	const otherItems = hasFocusedItem
		? videoItems.filter((child) => child.props?.consumer?.id !== focusedId)
		: videoItems

	const renderGridItems = (items, isFocused = false) => {
		return items.map((child) => {
			return (
				<motion.div
					key={child.key}
					className={classnames("video-grid__item", {
						"video-grid__item--focused": isFocused,
						"video-grid__item--preview":
							hasFocusedItem && !isFocused,
					})}
					layout
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.3, type: "spring" }}
				>
					{child}
				</motion.div>
			)
		})
	}

	if (itemCount === 0) {
		return (
			<div
				className={classnames(
					"video-grid",
					"video-grid--empty",
					className,
				)}
			>
				<h2>No video streams available</h2>
			</div>
		)
	}

	return (
		<div
			className={classnames("video-grid", className, {
				"video-grid--focused": hasFocusedItem,
				"video-grid--single": itemCount === 1,
				"video-grid--dual": itemCount === 2,
				"video-grid--small": itemCount <= 4,
				"video-grid--medium": itemCount > 4 && itemCount <= 9,
				"video-grid--large": itemCount > 9,
			})}
			style={{
				"--grid-cols": cols,
				"--grid-rows": rows,
			}}
			{...props}
		>
			<AnimatePresence mode="wait">
				{hasFocusedItem ? (
					<motion.div
						key="focused-layout"
						className="video-grid__focused-layout"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{otherItems.length > 0 && (
							<div className="video-grid__preview-bar">
								<div className="video-grid__preview-content">
									{renderGridItems(otherItems)}
								</div>
							</div>
						)}

						<div className="video-grid__focused-container">
							{focusedItem &&
								renderGridItems([focusedItem], true)}
						</div>
					</motion.div>
				) : (
					<motion.div
						key="grid-layout"
						className={classnames("video-grid__grid-container", {
							"video-grid__grid-container--single":
								itemCount === 1,
						})}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						{renderGridItems(videoItems)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

VideoGrid.propTypes = {
	children: PropTypes.node,
	focusedId: PropTypes.string,
	className: PropTypes.string,
}

VideoGrid.defaultProps = {
	children: null,
	focusedId: null,
	className: "",
}

export default VideoGrid
