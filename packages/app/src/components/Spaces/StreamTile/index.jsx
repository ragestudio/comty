import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"
import Button from "@ui/Button"
import Slider from "@ui/Slider"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import { useStreamVolumePersistence } from "@hooks/useStreamVolumePersistence"

import "./index.less"

const StreamTile = ({ stream, userData, mode = "grid", onTileClick }) => {
	const rtc = app.cores.mediartc.instance()

	const videoRef = React.useRef(null)
	const containerRef = React.useRef(null)
	const idleTimeoutRef = React.useRef(null)

	const [isLoading, setIsLoading] = React.useState(false)
	const [hasError, setHasError] = React.useState(false)
	const [mediaStream, setMediaStream] = React.useState(null)
	const [volume, setLocalVolume] = React.useState(100)

	const [isFullscreen, setIsFullscreen] = React.useState(false)
	const [isIdle, setIsIdle] = React.useState(false)

	const { getVolume, setVolume } = useStreamVolumePersistence()

	const showControls = mode !== "preview"

	React.useEffect(() => {
		if (stream.userId) {
			setLocalVolume(getVolume(stream.userId) ?? 100)
		}
	}, [stream.userId, getVolume])

	const checkMedia = React.useCallback(() => {
		if (stream.isSelf && stream.stream) {
			setMediaStream(stream.stream)
			return
		}

		const screen = rtc.screens.get(stream.userId)

		if (screen?.media) {
			setMediaStream(screen.media)
			setHasError(false)
		} else {
			setMediaStream(null)
		}
	}, [stream, rtc])

	React.useEffect(() => checkMedia(), [checkMedia])

	React.useEffect(() => {
		const videoElement = videoRef.current
		if (!videoElement) {
			return
		}

		if (mediaStream) {
			videoElement.srcObject = mediaStream
			videoElement.play().catch(() => {})
		} else {
			videoElement.srcObject = null
		}
		return () => {
			if (videoElement) {
				videoElement.srcObject = null
			}
		}
	}, [mediaStream])

	React.useEffect(() => {
		if (videoRef.current) {
			const screen = rtc.screens.get(stream.userId)

			if (stream.isSelf) {
				videoRef.current.muted = true
			} else {
				videoRef.current.muted = screen?.shouldMuteVideo || false
				videoRef.current.volume = volume / 100
			}
		}
	}, [volume, stream.userId, stream.isSelf, rtc])

	React.useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener("fullscreenchange", handleFullscreenChange)
		return () =>
			document.removeEventListener(
				"fullscreenchange",
				handleFullscreenChange,
			)
	}, [])

	const resetIdleTimer = React.useCallback(() => {
		if (!isFullscreen) return

		setIsIdle(false)

		if (idleTimeoutRef.current) {
			clearTimeout(idleTimeoutRef.current)
		}

		idleTimeoutRef.current = setTimeout(() => {
			setIsIdle(true)
		}, 1000)
	}, [isFullscreen])

	const handleMouseMove = React.useCallback(() => {
		if (isFullscreen) {
			resetIdleTimer()
		}
	}, [isFullscreen, resetIdleTimer])

	const handleMouseLeave = React.useCallback(() => {
		if (isFullscreen) {
			setIsIdle(true)
			if (idleTimeoutRef.current) {
				clearTimeout(idleTimeoutRef.current)
			}
		}
	}, [isFullscreen])

	React.useEffect(() => {
		if (isFullscreen) {
			resetIdleTimer()
		} else {
			setIsIdle(false)
			if (idleTimeoutRef.current) {
				clearTimeout(idleTimeoutRef.current)
			}
		}

		return () => {
			if (idleTimeoutRef.current) {
				clearTimeout(idleTimeoutRef.current)
			}
		}
	}, [isFullscreen, resetIdleTimer])

	const onVolumeChange = React.useCallback(
		(value) => {
			setLocalVolume(value)

			if (stream?.userId) {
				setVolume(stream.userId, value)
			}

			const screen = rtc.screens.get(stream.userId)
			if (screen?.setVolume) {
				screen.setVolume(value)
			}
		},
		[stream.userId, setVolume, rtc],
	)

	const handleStart = React.useCallback(
		async (e) => {
			e.stopPropagation()

			if (stream.isSelf) {
				return
			}

			setIsLoading(true)
			setHasError(false)

			try {
				await rtc.screens.start(stream.producer.id)
				checkMedia()
			} catch (error) {
				setHasError(true)
			} finally {
				setIsLoading(false)
			}
		},
		[stream, rtc, checkMedia],
	)

	const handleStop = React.useCallback(
		async (e) => {
			e.stopPropagation()

			if (stream.isSelf) {
				return
			}

			try {
				const screen = rtc.screens.get(stream.userId)

				if (screen) {
					await screen.stop()
				}

				checkMedia()
			} catch (error) {
				console.warn("failed to stop stream:", error)
			}
		},
		[stream, rtc, checkMedia],
	)

	const handleFullscreenClick = React.useCallback(async () => {
		if (!document.fullscreenElement) {
			try {
				if (containerRef.current.requestFullscreen) {
					await containerRef.current.requestFullscreen()
				} else if (containerRef.current.webkitRequestFullscreen) {
					await containerRef.current.webkitRequestFullscreen()
				}
			} catch (err) {
				console.error("Failed to enter fullscreen:", err)
			}
		} else {
			if (document.exitFullscreen) {
				await document.exitFullscreen()
			}
		}
	}, [])

	const handleTileClick = React.useCallback(
		(e) => {
			if (!e.target.classList.contains("video-stream-tile__overlay")) {
				return
			}

			if (mode === "single") {
				return
			}

			if (typeof onTileClick === "function") {
				onTileClick(stream.id)
			}
		},
		[stream.id, onTileClick, mode],
	)

	const hasVideo = !!mediaStream

	return (
		<motion.div
			layout
			onClick={handleTileClick}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className={classnames("video-stream-tile", {
				[`video-stream-tile--${mode}`]: mode !== "grid",
				"video-stream-tile--active": hasVideo,
				"video-stream-tile--error": hasError,
				"video-stream-tile--loading": isLoading,
				"video-stream-tile--fullscreen-idle": isFullscreen && isIdle,
			})}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ type: "spring", bounce: 0, duration: 0.35 }}
			ref={containerRef}
		>
			<div className="video-stream-tile__overlay">
				{userData && (
					<div className="video-stream-tile__user">
						<UserPreview
							user={userData}
							onClick={() => {}}
							small
						/>
					</div>
				)}

				{hasError && (
					<div className="video-stream-tile__error">
						<span>failed to start stream</span>

						{showControls && (
							<Button
								onClick={(e) => {
									e.stopPropagation()
									setHasError(false)
								}}
							>
								dismiss
							</Button>
						)}
					</div>
				)}

				{!hasVideo &&
					!stream.isSelf &&
					!hasError &&
					!isLoading &&
					showControls && (
						<div className="video-stream-tile__start">
							<Button
								onClick={handleStart}
								disabled={isLoading}
							>
								start
							</Button>
						</div>
					)}

				{isLoading && (
					<div className="video-stream-tile__loading">
						<span>starting...</span>
					</div>
				)}

				{hasVideo && !hasError && showControls && (
					<div className="video-stream-tile__controls">
						{!stream.isSelf && (
							<div className="video-stream-tile__controls__volume bg-accent">
								<Icons.Volume2 />
								<Slider
									value={volume}
									onChange={onVolumeChange}
									onChangeComplete={onVolumeChange}
								/>
							</div>
						)}

						<Button
							icon={<Icons.Fullscreen />}
							onClick={handleFullscreenClick}
						/>

						{!stream.isSelf && (
							<Button onClick={handleStop}>stop</Button>
						)}
					</div>
				)}
			</div>

			<video
				ref={videoRef}
				playsInline
				controls={false}
			/>
		</motion.div>
	)
}

export default StreamTile
