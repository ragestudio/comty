import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence, useIsPresent } from "motion/react"
import PropTypes from "prop-types"

import useLayoutInterface from "@hooks/useLayoutInterface"
import useToolsBarStore from "@/stores/toolsbar"

import WidgetsWrapper from "@components/WidgetsWrapper"

import "./index.less"

/**
 * @param {{ renders?: { top?: any[], bottom?: any[] } }} props
 */
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

const ToolsBarWrapper = (props) => {
	const store = useToolsBarStore()
	const enabled = store.hasAnyRenders() && store.visible

	useLayoutInterface("tools_bar", store)

	React.useEffect(() => {
		setTimeout(() => {
			store.toggleVisibility(true)
		}, 10)
	}, [])

	if (props.onlyController === true) {
		return null
	}

	return (
		<AnimatePresence>
			{enabled && <ToolsBar renders={store.renders} />}
		</AnimatePresence>
	)
}

export default ToolsBarWrapper
