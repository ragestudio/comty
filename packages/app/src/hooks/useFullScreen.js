import { useCallback, useEffect, useState } from "react"

const toggleFullScreen = (to) => {
	const targetState = to ?? !document.fullscreenElement

	try {
		if (targetState) {
			document.documentElement.requestFullscreen()
		} else if (document.fullscreenElement) {
			document.exitFullscreen()
		}
	} catch (error) {
		console.error("Fullscreen toggle failed:", error)
	}
}

export default ({ onEnter, onExit } = {}) => {
	const [isFullScreen, setIsFullScreen] = useState(false)

	const handleFullScreenChange = useCallback(() => {
		const fullScreenState = !!document.fullscreenElement
		setIsFullScreen(fullScreenState)

		if (fullScreenState) {
			onEnter?.()
		} else {
			onExit?.()
		}
	}, [onEnter, onExit])

	useEffect(() => {
		document.addEventListener("fullscreenchange", handleFullScreenChange)

		return () => {
			document.removeEventListener(
				"fullscreenchange",
				handleFullScreenChange,
			)
		}
	}, [handleFullScreenChange])

	return {
		isFullScreen,
		toggleFullScreen,
		handleFullScreenChange,
	}
}
