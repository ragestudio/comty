import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"

import Button from "@ui/Button"
import Slider from "@ui/Slider"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"

import "./index.less"

const IDLE_DELAY = 1500

// item shape provided by the sdk, mediaStream is null while the media is
// disabled or still connecting
export interface StreamTileStream {
	id: string
	userId?: string
	isSelf?: boolean
	mediaStream?: MediaStream | null
	volume?: number
	onStart?: () => void | Promise<void>
	onStop?: () => void | Promise<void>
	onVolume?: (volume: number) => void
}

export interface StreamTileProps {
	stream: StreamTileStream
	userData?: any
	mode?: "grid" | "single" | "hero" | "preview"
	onTileClick?: (id: string) => void
}

const StreamTile = ({
	stream,
	userData = null,
	mode = "grid",
	onTileClick,
}: StreamTileProps) => {
	const videoRef = React.useRef<HTMLVideoElement | null>(null)
	const containerRef = React.useRef<HTMLDivElement | null>(null)
	const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

	const [isLoading, setIsLoading] = React.useState(false)
	const [hasError, setHasError] = React.useState(false)
	const [volume, setVolume] = React.useState(stream.volume ?? 100)
	const [isFullscreen, setIsFullscreen] = React.useState(false)
	const [isIdle, setIsIdle] = React.useState(false)

	const mediaStream = stream.mediaStream ?? null
	const hasVideo = !!mediaStream
	const showControls = mode !== "preview"
	const canControlVolume =
		!stream.isSelf && typeof stream.onVolume === "function"

	// the sdk owns the playback volume, keep the slider in sync with the store
	React.useEffect(() => {
		if (stream.volume !== undefined) {
			setVolume(stream.volume)
		}
	}, [stream.volume])

	React.useEffect(() => {
		const element = videoRef.current

		if (!element) return

		element.srcObject = mediaStream

		if (mediaStream) {
			element.play().catch(() => {})
		}

		return () => {
			element.srcObject = null
		}
	}, [mediaStream])

	React.useEffect(() => {
		if (hasVideo) setHasError(false)
	}, [hasVideo])

	React.useEffect(() => {
		const onFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement === containerRef.current)
		}

		document.addEventListener("fullscreenchange", onFullscreenChange)

		return () =>
			document.removeEventListener("fullscreenchange", onFullscreenChange)
	}, [])

	const clearIdleTimer = React.useCallback(() => {
		if (idleTimerRef.current) {
			clearTimeout(idleTimerRef.current)
			idleTimerRef.current = null
		}
	}, [])

	const revealControls = React.useCallback(() => {
		setIsIdle(false)
		clearIdleTimer()

		idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_DELAY)
	}, [clearIdleTimer])

	React.useEffect(() => {
		if (!isFullscreen) {
			setIsIdle(false)
			clearIdleTimer()
			return
		}

		revealControls()

		return clearIdleTimer
	}, [isFullscreen, revealControls, clearIdleTimer])

	const handleMouseMove = React.useCallback(() => {
		if (isFullscreen) revealControls()
	}, [isFullscreen, revealControls])

	const handleMouseLeave = React.useCallback(() => {
		if (!isFullscreen) return

		setIsIdle(true)
		clearIdleTimer()
	}, [isFullscreen, clearIdleTimer])

	const handleVolumeChange = React.useCallback((value: number) => {
		setVolume(value)
	}, [])

	const handleVolumeCommit = React.useCallback(
		(value: number) => {
			setVolume(value)
			stream.onVolume?.(value)
		},
		[stream.onVolume],
	)

	const handleStart = React.useCallback(
		async (event: React.MouseEvent) => {
			event.stopPropagation()

			if (stream.isSelf || !stream.onStart) return

			setIsLoading(true)
			setHasError(false)

			try {
				await stream.onStart()
			} catch {
				setHasError(true)
			} finally {
				setIsLoading(false)
			}
		},
		[stream.isSelf, stream.onStart],
	)

	const handleStop = React.useCallback(
		async (event: React.MouseEvent) => {
			event.stopPropagation()

			if (stream.isSelf || !stream.onStop) return

			try {
				await stream.onStop()
			} catch (error) {
				console.warn("failed to stop stream:", error)
			}
		},
		[stream.isSelf, stream.onStop],
	)

	const handleToggleFullscreen = React.useCallback(async () => {
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen()
				return
			}

			await containerRef.current?.requestFullscreen()
		} catch (error) {
			console.error("failed to toggle fullscreen:", error)
		}
	}, [])

	// clicking the tile selects it, controls and sliders must not trigger it
	const handleTileClick = React.useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			if (!onTileClick || mode === "single") return

			const target = event.target as HTMLElement

			if (target.closest(".video-stream-tile__controls")) return
			if (target.closest("button")) return

			onTileClick(stream.id)
		},
		[onTileClick, mode, stream.id],
	)

	return (
		<motion.div
			layout
			ref={containerRef}
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
								onClick={(event) => {
									event.stopPropagation()
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
					showControls &&
					stream.onStart && (
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
						{canControlVolume && (
							<div className="video-stream-tile__controls__volume bg-accent">
								<Icons.Volume2 />
								<Slider
									value={volume}
									onChange={handleVolumeChange}
									onChangeComplete={handleVolumeCommit}
								/>
							</div>
						)}

						<Button
							icon={<Icons.Fullscreen />}
							onClick={handleToggleFullscreen}
						/>

						{!stream.isSelf && stream.onStop && (
							<Button onClick={handleStop}>stop</Button>
						)}
					</div>
				)}
			</div>

			<video
				ref={videoRef}
				playsInline
				muted
				controls={false}
			/>
		</motion.div>
	)
}

export default React.memo(StreamTile)
