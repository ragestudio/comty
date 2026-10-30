import React from "react"
import { motion, AnimatePresence } from "motion/react"

import { useHeaderStore } from "@/stores/header"

import "./index.less"

export const HeaderBar = () => {
	const render = useHeaderStore((state) => state.render)

	React.useEffect(() => {
		app.layout.toggleDisableTopLayoutPadding(Boolean(render))
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
					<div className="page_header bg-accent">
						{React.cloneElement(render.component, render.options.props ?? {})}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default HeaderBar
