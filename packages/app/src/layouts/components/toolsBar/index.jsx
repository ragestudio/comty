import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence, useIsPresent } from "motion/react"
import PropTypes from "prop-types"

import useLayoutInterface from "@hooks/useLayoutInterface"
import WidgetsWrapper from "@components/WidgetsWrapper"

import "./index.less"

const ToolsBar = ({ renders = {} }) => {
	const isPresent = useIsPresent()

	return (
		<motion.div
			className={classnames("tools-bar-wrapper", {
				["hidden"]: !isPresent,
			})}
			animate={{
				x: 0,
				width: "100%",
				minWidth: app.cores.style.vars["toolsbar_wrapper_min-width"],
				padding: app.cores.style.vars["toolsbar_wrapper_padding"],
			}}
			initial={{
				x: "100%",
				width: "0%",
				minWidth: 0,
				padding: 0,
			}}
			exit={{
				x: "100%",
				width: "0%",
				minWidth: 0,
				padding: 0,
			}}
			transition={{
				type: "spring",
				stiffness: 100,
				damping: 20,
			}}
		>
			<div
				id="tools_bar"
				className="tools-bar bg-accent"
			>
				<div className="attached_renders top">
					{renders.top.map((render, index) => {
						return React.createElement(render.component, {
							...render.props,
							key: index,
							id: render.id,
						})
					})}
				</div>

				<WidgetsWrapper />

				<div className="attached_renders bottom">
					{renders.bottom.map((render, index) => {
						return React.createElement(render.component, {
							...render.props,
							key: index,
						})
					})}
				</div>
			</div>
		</motion.div>
	)
}

ToolsBar.propTypes = {
	renders: PropTypes.object,
}

const ToolsBarWrapper = () => {
	const [visible, setVisible] = React.useState(false)
	const [topRenders, setTopRenders] = React.useState([])
	const [bottomRenders, setBottomRenders] = React.useState([])

	const hasAnyRenders = topRenders.length > 0 || bottomRenders.length > 0
	const isVisible = hasAnyRenders && visible

	useLayoutInterface("tools_bar", {
		toggleVisibility: (to) => {
			setVisible((prev) => {
				return to ?? !prev
			})
		},
		attachRender: (id, component, props, { position = "bottom" } = {}) => {
			let stateUpdater = setBottomRenders

			if (position === "top") {
				stateUpdater = setTopRenders
			}

			if (position === "bottom") {
				stateUpdater = setBottomRenders
			}

			stateUpdater((prev) => {
				return [
					...prev,
					{
						id: id,
						component: component,
						props: props,
					},
				]
			})

			return component
		},
		detachRender: (id) => {
			setTopRenders((prev) => {
				return prev.filter((render) => render.id !== id)
			})

			setBottomRenders((prev) => {
				return prev.filter((render) => render.id !== id)
			})

			return true
		},
	})

	React.useEffect(() => {
		setTimeout(() => {
			setVisible(true)
		}, 10)
	}, [])

	return (
		<AnimatePresence>
			{isVisible && (
				<ToolsBar
					renders={{
						top: topRenders,
						bottom: bottomRenders,
					}}
				/>
			)}
		</AnimatePresence>
	)
}

export default ToolsBarWrapper
