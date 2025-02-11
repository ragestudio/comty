import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const LyricsText = React.forwardRef((props, textRef) => {
	const [playerState] = usePlayerStateContext()

	const { lyrics } = props

	const [syncInterval, setSyncInterval] = React.useState(null)
	const [currentLineIndex, setCurrentLineIndex] = React.useState(0)
	const [visible, setVisible] = React.useState(false)

	function syncPlayback() {
		const currentTrackTime = app.cores.player.controls.seek() * 1000

		const lineIndex = lyrics.synced_lyrics.findIndex((line) => {
			return (
				currentTrackTime >= line.startTimeMs &&
				currentTrackTime <= line.endTimeMs
			)
		})

		if (lineIndex === -1) {
			if (!visible) {
				setVisible(false)
			}

			return false
		}

		const line = lyrics.synced_lyrics[lineIndex]

		setCurrentLineIndex(lineIndex)

		if (line.break) {
			return setVisible(false)
		}

		if (line.text) {
			return setVisible(true)
		}
	}

	function startSyncInterval() {
		if (!lyrics || !lyrics.synced_lyrics) {
			stopSyncInterval()
			return false
		}

		if (playerState.playback_status !== "playing") {
			stopSyncInterval()
			return false
		}

		if (syncInterval) {
			stopSyncInterval()
		}

		setSyncInterval(setInterval(syncPlayback, 100))
	}

	function stopSyncInterval() {
		clearInterval(syncInterval)
		setSyncInterval(null)
	}

	//* Handle when current line index change
	React.useEffect(() => {
		if (currentLineIndex === 0) {
			setVisible(false)
		} else {
			setVisible(true)

			// find line element by id
			const lineElement = textRef.current.querySelector(
				`#lyrics-line-${currentLineIndex}`,
			)

			// center scroll to current line
			if (lineElement) {
				lineElement.scrollIntoView({
					behavior: "smooth",
					block: "center",
				})
			} else {
				// scroll to top
				textRef.current.scrollTop = 0
			}
		}
	}, [currentLineIndex])

	//* Handle when playback status change
	React.useEffect(() => {
		startSyncInterval()
	}, [playerState.playback_status])

	//* Handle when manifest object change, reset...
	React.useEffect(() => {
		setVisible(false)
		setCurrentLineIndex(0)
	}, [playerState.track_manifest])

	React.useEffect(() => {
		startSyncInterval()
	}, [lyrics])

	React.useEffect(() => {
		return () => {
			clearInterval(syncInterval)
		}
	}, [])

	if (!lyrics?.synced_lyrics) {
		return null
	}

	return (
		<div className="lyrics-text-wrapper">
			<AnimatePresence>
				{visible && (
					<motion.div
						ref={textRef}
						className="lyrics-text"
						animate={{
							opacity: 1,
						}}
						initial={{
							opacity: 0,
						}}
						exit={{
							opacity: 0,
						}}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
						}}
					>
						{lyrics.synced_lyrics.map((line, index) => {
							return (
								<p
									key={index}
									id={`lyrics-line-${index}`}
									className={classnames("line", {
										["current"]: currentLineIndex === index,
									})}
								>
									{line.text}
								</p>
							)
						})}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
})

export default LyricsText
