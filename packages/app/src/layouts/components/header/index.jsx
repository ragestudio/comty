import React from "react"
import { motion, AnimatePresence } from "motion/react"

import useLayoutInterface from "@hooks/useLayoutInterface"

import "./index.less"

export default (props) => {
	const [render, setRender] = React.useState(null)

	useLayoutInterface("header", {
		render: (component, options) => {
			if (component === null) {
				return setRender(null)
			}

			return setRender({
				component,
				options,
			})
		},
	})

	React.useEffect(() => {
		if (render) {
			app.layout.toggleDisableTopLayoutPadding(true)
		} else {
			app.layout.toggleDisableTopLayoutPadding(false)
		}
	}, [render])

	return (
		<AnimatePresence>
			{render && (
				<motion.div
					className="page_header_wrapper"
					animate={{
						y: 0,
					}}
					initial={{
						y: -100,
					}}
					exit={{
						y: -100,
					}}
					transition={{
						type: "spring",
						stiffness: 100,
						damping: 20,
					}}
				>
					<div className="page_header">
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
