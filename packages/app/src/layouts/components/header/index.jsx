import React from "react"
import { motion, AnimatePresence } from "motion/react"

import useLayoutInterface from "@hooks/useLayoutInterface"

import "./index.less"

const HeaderBar = (props) => {
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
					layoutRoot
					className="page_header_wrapper"
					initial={{
						y: -100,
						width: "100%",
					}}
					animate={{
						y: 0,
						position: "sticky",
						width: "100%",
					}}
					exit={{
						y: -100,
						position: "absolute",
						width: "100%",
						top: 0,
						left: 0,
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

export default HeaderBar
