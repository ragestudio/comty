import React from "react"
import { motion } from "motion/react"

export default () => {
	const [active, setActive] = React.useState(
		!!app.cores.style.vars["backgroundImage"],
	)
	const [bgOpacity, setBgOpacity] = React.useState(
		app.cores.style.vars["backgroundColorTransparency"] ?? 1,
	)

	const handleStyleUpdate = () => {
		setActive(!!app.cores.style.vars["backgroundImage"])
		setBgOpacity(app.cores.style.vars["backgroundColorTransparency"])
	}

	React.useEffect(() => {
		app.eventBus.on("style.modify", handleStyleUpdate)

		return () => {
			app.eventBus.off("style.modify", handleStyleUpdate)
		}
	}, [])

	return (
		<motion.div
			className={"root_background"}
			initial={{ opacity: 0 }}
			animate={{
				opacity: active ? bgOpacity : 0,
			}}
		/>
	)
}
