import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import ErrorCatcher from "@components/ErrorCatcher"

import { useTopBarStore } from "@/stores/topbar"

import "./index.less"

export const TopBar = () => {
	const render = useTopBarStore((state) => state.render)
	const visible = useTopBarStore((state) => state.visible)
	const useSpacer = useTopBarStore((state) => state.useSpacer)

	React.useEffect(() => {
		if (useSpacer) {
			app.layout.toggleTopBarSpacer(visible)
			app.layout.togglePagePanelSpacer(false)
		} else {
			app.layout.toggleTopBarSpacer(false)
			app.layout.togglePagePanelSpacer(visible)
		}
	}, [visible, useSpacer])

	const heightValue = Number(
		app.cores.style.vars["top-bar-height"].replace("px", ""),
	)

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					className="top-bar_wrapper"
					animate={{
						y: 0,
						height: heightValue,
					}}
					initial={{
						y: -300,
						height: 0,
					}}
					exit={{
						y: -300,
						height: 0,
					}}
					transition={{
						type: "spring",
						stiffness: 100,
						damping: 20,
					}}
				>
					<div
						className={classnames(
							"top-bar bg-accent",
							render?.options?.className,
						)}
					>
						<ErrorCatcher noDisplay>
							{render?.component &&
								React.cloneElement(
									render.component,
									render.options.props ?? {},
								)}
						</ErrorCatcher>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default TopBar
