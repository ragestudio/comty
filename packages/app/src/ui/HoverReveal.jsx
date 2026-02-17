import React from "react"
import { motion, AnimatePresence } from "motion/react"

import "./HoverReveal.less"

const HoverReveal = ({ children, component }) => {
	const [isHovered, setIsHovered] = React.useState(false)

	return (
		<motion.div
			className="hover-reveal"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{children}

			<AnimatePresence mode="wait">
				{isHovered && (
					<motion.div
						className="hover-reveal-content"
						initial={{ width: "0px", opacity: 0 }}
						exit={{ width: "0px", opacity: 0 }}
						animate={{ width: "100%", opacity: 1 }}
					>
						{component}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

export default HoverReveal
