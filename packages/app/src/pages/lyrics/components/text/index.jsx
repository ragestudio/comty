import React from "react"
import classnames from "classnames"
import { motion, AnimatePresence } from "motion/react"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"
import binarySearchTime from "@utils/binarySearchTime"

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

	const syncStateRef = React.useRef({
		lastLineIndex: -1,
		lastWordIndex: -1,
		isVisible: false,
	})

	function syncPlayback() {
		const currentTrackTime = app.cores.player.controls.seek() * 1000

		let lineIndex = -1

		const len = lyrics.synced_lyrics.length

		if (
			syncStateRef.current.lastLineIndex !== -1 &&
			syncStateRef.current.lastLineIndex < len
		) {
			const lastLine =
				lyrics.synced_lyrics[syncStateRef.current.lastLineIndex]
			const lastStart = lastLine.startTimeMs ?? lastLine.start_ms
			const lastEnd = lastLine.endTimeMs ?? lastLine.end_ms

			if (currentTrackTime >= lastStart && currentTrackTime <= lastEnd) {
				lineIndex = syncStateRef.current.lastLineIndex
			} else if (syncStateRef.current.lastLineIndex + 1 < len) {
				const nextLine =
					lyrics.synced_lyrics[syncStateRef.current.lastLineIndex + 1]
				const nextStart = nextLine.startTimeMs ?? nextLine.start_ms
				const nextEnd = nextLine.endTimeMs ?? nextLine.end_ms

				if (
					currentTrackTime >= nextStart &&
					currentTrackTime <= nextEnd
				) {
					lineIndex = syncStateRef.current.lastLineIndex + 1
				}
			}
		}

		if (lineIndex === -1) {
			lineIndex = binarySearchTime(lyrics.synced_lyrics, currentTrackTime)
		}

		if (lineIndex === -1) {
			if (syncStateRef.current.isVisible) {
				setVisible(false)
				syncStateRef.current.isVisible = false
			}

			syncStateRef.current.lastLineIndex = -1
			syncStateRef.current.lastWordIndex = -1

			return false
		}

		const line = lyrics.synced_lyrics[lineIndex]

		if (syncStateRef.current.lastLineIndex !== lineIndex) {
			setCurrentLineIndex(lineIndex)
			syncStateRef.current.lastLineIndex = lineIndex
		}

		if (line.words) {
			let wordIndex = -1
			const wordsLen = line.words.length

			for (let i = 0; i < wordsLen; i++) {
				const w = line.words[i]
				const wStart = w.startTimeMs ?? w.start_ms
				const wEnd = w.endTimeMs ?? w.end_ms

				if (currentTrackTime >= wStart && currentTrackTime <= wEnd) {
					wordIndex = i
					break
				}
			}

			if (
				wordIndex !== -1 &&
				syncStateRef.current.lastWordIndex !== wordIndex
			) {
				setCurrentWordIndex(wordIndex)
				syncStateRef.current.lastWordIndex = wordIndex
			}
		}

		if ((line.break || !line.text) && syncStateRef.current.isVisible) {
			setVisible(false)
			syncStateRef.current.isVisible = false
		} else if (line.text && !syncStateRef.current.isVisible) {
			setVisible(true)
			syncStateRef.current.isVisible = true
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
		if (currentLineIndex === 0) {
			if (textRef.current) {
				textRef.current.scrollTop = 0
			}
		} else {
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
						if (line.words) {
							return (
								<div
									key={index}
									id={`lyrics-line-${index}`}
									className={classnames("line", "words", {
										["current"]: currentLineIndex === index,
									})}
								>
									{line.words.map((item, wordIndex) => (
										<p
											key={wordIndex}
											className={classnames(
												"line__word",
												{
													["current"]:
														currentWordIndex ===
															wordIndex &&
														currentLineIndex ===
															index,
												},
											)}
										>
											{item.word}
										</p>
									))}
								</div>
							)
						}
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
