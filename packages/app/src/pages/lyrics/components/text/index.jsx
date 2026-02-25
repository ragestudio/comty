import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import "./index.less"

// eslint-disable-next-line
const LyricsText = React.forwardRef((props, forwardedRef) => {
	const [playerState] = usePlayerStateContext()

	const { lyrics } = props

	const textRef = forwardedRef ?? React.useRef(null)
	const currentTrackId = React.useRef(null)

	const [visible, setVisible] = React.useState(false)

	const [currentLineIndex, setCurrentLineIndex] = React.useState(0)
	const [currentWordIndex, setCurrentWordIndex] = React.useState(0)
	const [syncInterval, setSyncInterval] = React.useState(null)

	function syncPlayback() {
		const currentTrackTime = app.cores.player.controls.seek() * 1000

		const lineIndex = lyrics.synced_lyrics.findIndex((line) => {
			return (
				currentTrackTime >= (line.startTimeMs ?? line.start_ms) &&
				currentTrackTime <= (line.endTimeMs ?? line.end_ms)
			)
		})

		if (lineIndex === -1) {
			setVisible(false)

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
		if (!lyrics?.synced_lyrics) {
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
		// console.debug("[lyrics] currentLineIndex", currentLineIndex)
		// console.debug("[lyrics] currentWordIndex", currentWordIndex)

		if (currentLineIndex === 0) {
			setVisible(false)

			if (textRef.current) {
				textRef.current.scrollTop = 0
			}
		} else {
			setVisible(true)

			if (textRef.current) {
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
				}
			}
		}
	}, [currentLineIndex])

	//* Handle when playback status change
	React.useEffect(() => {
		startSyncInterval()
	}, [playerState.playback_status])

	//* Handle when manifest object change, reset...
	React.useEffect(() => {
		currentTrackId.current = playerState.track_manifest?.id

		if (playerState.track_manifest?.id !== currentTrackId.current) {
			setVisible(false)
			setCurrentLineIndex(0)

			if (textRef.current) {
				textRef.current.scrollTop = 0
			}
		}

		// if (playerState.track_manifest) {
		// 	if (playerState.track_manifest._id === "699e13105326fc5306139905") {
		// 		fetch("/vtt-mindset-test.vtt").then(async (data) => {
		// 			vttParser.current.parse(await data.text())
		// 			const parsed = vttParser.current.getData()
		// 			setVTTData(parsed)
		// 			console.log(parsed)
		// 		})
		// 	}
		// }
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
		<div
			className={classnames("lyrics-text-wrapper", {
				["static"]: props.static,
			})}
		>
			<AnimatePresence>
				<motion.div
					ref={textRef}
					className="lyrics-text"
					animate={{
						opacity: props.static ? 1 : visible ? 1 : 0,
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
					{lyrics?.synced_lyrics.map((line, index) => {
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
			</AnimatePresence>
		</div>
	)
})

export default LyricsText
