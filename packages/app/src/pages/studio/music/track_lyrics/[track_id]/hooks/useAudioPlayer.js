import React, { useEffect, useCallback } from "react"
import shaka from "shaka-player/dist/shaka-player.compiled.js"
import { useLyricsEditor } from "../context/LyricsEditorContext"

export const useAudioPlayer = (src) => {
	const { state, dispatch } = useLyricsEditor()

	const audioRef = React.useRef(new Audio())
	const playerRef = React.useRef(null)
	const waitTimeoutRef = React.useRef(null)
	const lastSeekTimeRef = React.useRef(0)
	const scrubTimeoutRef = React.useRef(null)

	const initializePlayer = useCallback(async () => {
		if (!src) {
			return null
		}

		try {
			dispatch({ type: "SET_AUDIO_LOADING", payload: true })
			dispatch({ type: "SET_AUDIO_ERROR", payload: null })

			audioRef.current.loop = true

			// Cleanup existing player
			if (playerRef.current) {
				await playerRef.current.destroy()
				playerRef.current = null
			}

			// Check browser support
			if (!shaka.Player.isBrowserSupported()) {
				throw new Error("Browser does not support DASH playback")
			}

			// Create new player
			playerRef.current = new shaka.Player()

			await playerRef.current.attach(audioRef.current)

			// Setup DASH error handling
			playerRef.current.addEventListener("error", (event) => {
				const error = event.detail

				dispatch({
					type: "SET_AUDIO_ERROR",
					payload: `DASH Error: ${error.message || "Playback failed"}`,
				})
			})

			// Load the source
			await playerRef.current.load(src)
			dispatch({ type: "SET_AUDIO_LOADING", payload: false })
		} catch (error) {
			console.error("Player initialization error:", error)
			dispatch({ type: "SET_AUDIO_ERROR", payload: error.message })
			dispatch({ type: "SET_AUDIO_LOADING", payload: false })
		}
	}, [src, dispatch])

	// Audio controls
	const play = useCallback(async () => {
		if (!audioRef.current) return

		try {
			await audioRef.current.play()
		} catch (error) {
			dispatch({
				type: "SET_AUDIO_ERROR",
				payload:
					error.name === "NotAllowedError"
						? "Playback blocked. Please interact with the page first."
						: "Failed to play audio",
			})
		}
	}, [dispatch])

	const pause = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause()
		}
	}, [])

	const toggle = useCallback(() => {
		if (audioRef.current.paused) {
			play()
		} else {
			pause()
		}
	}, [audioRef.current])

	const seek = useCallback((time, scrub = false) => {
		if (audioRef.current && audioRef.current.duration > 0) {
			const clampedTime = Math.max(
				0,
				Math.min(time, audioRef.current.duration),
			)

			// Update currentTime immediately for responsive UI
			audioRef.current.currentTime = clampedTime

			if (audioRef.current.paused) {
				if (scrub === true) {
					// Clear any pending scrub preview
					if (scrubTimeoutRef.current) {
						clearTimeout(scrubTimeoutRef.current)
					}

					const scrubDuration = 100

					audioRef.current.play().then(() => {
						scrubTimeoutRef.current = setTimeout(() => {
							audioRef.current.pause()
							audioRef.current.currentTime = clampedTime
						}, scrubDuration)
					})
				} else {
					audioRef.current.play()
				}
			}
		}
	}, [])

	const setSpeed = useCallback(
		(speed) => {
			if (audioRef.current) {
				const clampedSpeed = Math.max(0.25, Math.min(4, speed))
				audioRef.current.playbackRate = clampedSpeed
				dispatch({ type: "SET_AUDIO_SPEED", payload: clampedSpeed })
			}
		},
		[dispatch],
	)

	const setVolume = useCallback(
		(volume) => {
			if (audioRef.current) {
				const clampedVolume = Math.max(0, Math.min(1, volume))
				audioRef.current.volume = clampedVolume
				dispatch({ type: "SET_AUDIO_VOLUME", payload: clampedVolume })
			}
		},
		[dispatch],
	)

	// Initialize player when src changes
	useEffect(() => {
		initializePlayer()

		return () => {
			if (playerRef.current) {
				playerRef.current.destroy().catch(console.error)
			}
		}
	}, [initializePlayer])

	// Setup audio event listeners
	useEffect(() => {
		const audio = audioRef.current

		if (!audio) {
			return null
		}

		const handlePlay = () => {
			dispatch({ type: "SET_AUDIO_PLAYING", payload: true })
		}

		const handlePause = () => {
			dispatch({ type: "SET_AUDIO_PLAYING", payload: false })
		}

		const handleWaiting = () => {
			if (waitTimeoutRef.current) {
				clearTimeout(waitTimeoutRef.current)
				waitTimeoutRef.current = null
			}

			waitTimeoutRef.current = setTimeout(() => {
				dispatch({ type: "SET_AUDIO_LOADING", payload: true })
			}, 1000)
		}

		const handlePlaying = () => {
			if (waitTimeoutRef.current) {
				clearTimeout(waitTimeoutRef.current)
				waitTimeoutRef.current = null
			}

			waitTimeoutRef.current = setTimeout(() => {
				dispatch({ type: "SET_AUDIO_LOADING", payload: false })
			}, 300)
		}

		const handleError = () => {
			const error = audio.error
			let errorMessage = "Audio playback error"

			if (error) {
				switch (error.code) {
					case error.MEDIA_ERR_NETWORK:
						errorMessage = "Network error loading audio"
						break
					case error.MEDIA_ERR_DECODE:
						errorMessage = "Audio decoding error"
						break
					case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
						errorMessage = "Audio format not supported"
						break
					default:
						errorMessage = "Unknown audio error"
				}
			}

			dispatch({ type: "SET_AUDIO_ERROR", payload: errorMessage })
		}

		// Add event listeners
		audio.addEventListener("play", handlePlay)
		audio.addEventListener("pause", handlePause)
		audio.addEventListener("waiting", handleWaiting)
		audio.addEventListener("playing", handlePlaying)
		audio.addEventListener("error", handleError)

		return () => {
			// Remove event listeners
			audio.removeEventListener("play", handlePlay)
			audio.removeEventListener("pause", handlePause)
			audio.removeEventListener("waiting", handleWaiting)
			audio.removeEventListener("playing", handlePlaying)
			audio.removeEventListener("error", handleError)
		}
	}, [dispatch])

	return {
		audio: audioRef,
		play,
		pause,
		toggle,
		seek,
		setSpeed,
		setVolume,
		isPlaying: state.isPlaying,
		playbackSpeed: state.playbackSpeed,
		volume: state.volume,
		isLoading: state.isLoading,
		error: state.error,
	}
}

export default useAudioPlayer
