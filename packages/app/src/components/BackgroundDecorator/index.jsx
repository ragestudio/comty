import React from "react"
import { motion } from "motion/react"
import fetchMime from "@utils/fetchMime"

function cssUrlToString(url) {
	if (typeof url !== "string") {
		return null
	}

	return url.replace(/url\(['"]?(.*?)['"]?\)/, "$1")
}

export default () => {
	const bg_url = cssUrlToString(app.cores.style.vars["backgroundImage"])

	const [mime, setMime] = React.useState(null)
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

	React.useEffect(() => {
		// analize mime type with fetch head
		if (bg_url) {
			fetchMime(bg_url).then(setMime)
		}
	}, [bg_url])

	return (
		<motion.div
			className={"root_background"}
			initial={{ opacity: 0 }}
			animate={{
				opacity: active ? bgOpacity : 0,
			}}
		>
			{mime && mime.includes("video") && (
				<video
					loop
					muted
					src={bg_url}
					autoPlay
				/>
			)}
		</motion.div>
	)
}
