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
	const videoRef = React.useRef(null)
	const [isLoading, setIsLoading] = React.useState(false)
	const [hasError, setHasError] = React.useState(false)
	const [mediaStream, setMediaStream] = React.useState(null)
	const [volume, setLocalVolume] = React.useState(100)

	const rtc = app.cores.mediartc.instance()
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
			videoRef.current.muted = stream.isSelf
			videoRef.current.volume = volume / 100
		}
	}, [volume, stream.isSelf])

	const onVolumeChange = React.useCallback(
		(value) => {
			setLocalVolume(value)

			if (stream?.userId) {
				setVolume(stream.userId, value)
			}
		},
		[stream.userId, setVolume],
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

	const handleFullscreenClick = React.useCallback((e) => {
		e.stopPropagation()

		if (videoRef.current?.requestFullscreen) {
			videoRef.current.requestFullscreen()
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
			className={classnames("video-stream-tile", {
				[`video-stream-tile--${mode}`]: mode !== "grid",
				"video-stream-tile--active": hasVideo,
				"video-stream-tile--error": hasError,
				"video-stream-tile--loading": isLoading,
			})}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ type: "spring", bounce: 0, duration: 0.35 }}
		>
			<div className="video-stream-tile__overlay">
				{userData && (
					<div className="video-stream-tile__user">
						<UserPreview
							user={userData ?? {}}
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
						<div className="video-stream-tile__controls__volume bg-accent">
							<Icons.Volume2 />
							<Slider
								value={volume}
								onChange={onVolumeChange}
								onChangeComplete={onVolumeChange}
							/>
						</div>

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
			/>
		</motion.div>
	)
}

export default StreamTile
