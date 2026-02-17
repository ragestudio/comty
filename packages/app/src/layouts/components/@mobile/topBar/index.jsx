import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import useLayoutInterface from "@hooks/useLayoutInterface"
import useDefaultVisibility from "@hooks/useDefaultVisibility"

import "./index.less"

export default (props) => {
	const [visible, setVisible] = useDefaultVisibility()
	const [shouldUseTopBarSpacer, setShouldUseTopBarSpacer] =
		React.useState(true)
	const [render, setRender] = React.useState(null)

	useLayoutInterface("top_bar", {
		toggleVisibility: (to) => {
			setVisible((prev) => {
				if (typeof to === undefined) {
					to = !prev
				}

				return to
			})
		},
		render: (component, options) => {
			handleUpdateRender(component, options)
		},
		renderDefault: () => {
			setRender(null)
		},
		shouldUseTopBarSpacer: (to) => {
			app.layout.toggleTopBarSpacer(to)
			setShouldUseTopBarSpacer(to)
		},
	})

	const handleUpdateRender = (...args) => {
		if (document.startViewTransition) {
			return document.startViewTransition(() => {
				updateRender(...args)
			})
		}

		return updateRender(...args)
	}

	const updateRender = (component, options = {}) => {
		setRender({
			component,
			options,
		})
	}

	React.useEffect(() => {
		if (!shouldUseTopBarSpacer) {
			app.layout.togglePagePanelSpacer(true)
		} else {
			app.layout.togglePagePanelSpacer(false)
		}
	}, [shouldUseTopBarSpacer])

	React.useEffect(() => {
		if (shouldUseTopBarSpacer) {
			if (visible) {
				app.layout.toggleTopBarSpacer(true)
			} else {
				app.layout.toggleTopBarSpacer(false)
			}
		} else {
			if (visible) {
				app.layout.togglePagePanelSpacer(true)
			} else {
				app.layout.togglePagePanelSpacer(false)
			}

			app.layout.toggleTopBarSpacer(false)
		}
	}, [visible])

	React.useEffect(() => {
		if (render) {
			setVisible(true)
		} else {
			setVisible(false)
		}
	}, [render])

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
						{render?.component &&
							React.cloneElement(
								render?.component,
								render?.options?.props ?? {},
							)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
