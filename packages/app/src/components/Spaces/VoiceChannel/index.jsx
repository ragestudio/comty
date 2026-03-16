import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"
import Button from "@ui/Button"
import Slider from "@ui/Slider"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import useMediaRTCState from "@hooks/useMediaRTCState"
import { useStreamVolumePersistence } from "@hooks/useStreamVolumePersistence"

import UsersModel from "@models/user"

import "./index.less"

const StreamTile = ({
	stream,
	userData,
	mode = "grid",
	onTileClick,
	onStreamAction,
}) => {
	const videoRef = React.useRef(null)
	const [isLoading, setIsLoading] = React.useState(false)
	const [hasError, setHasError] = React.useState(false)
	const [mediaStream, setMediaStream] = React.useState(null)
	const [volume, setLocalVolume] = React.useState(100)

	const rtc = app.cores.mediartc.instance()

	const showControls = mode !== "preview"

	React.useEffect(() => {
		if (onStreamAction?.getVolume) {
			setLocalVolume(onStreamAction.getVolume(stream.userId) ?? 100)
		}
	}, [stream.userId, onStreamAction])

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

			if (onStreamAction?.setVolume) {
				onStreamAction.setVolume(stream.userId, value)
			}
		},
		[stream.userId, onStreamAction],
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

			onTileClick(stream.id)
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
				<div className="video-stream-tile__user">
					<UserPreview
						user={userData ?? {}}
						onClick={() => {}}
						small
					/>
				</div>

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

const VoiceChannel = () => {
	const state = useMediaRTCState()
	const [selectedStreamId, setSelectedStreamId] = React.useState(null)
	const [userData, setUserData] = React.useState({})
	const { getVolume, setVolume } = useStreamVolumePersistence()
	const fetchedUsersRef = React.useRef(new Set())

	const rtc = app.cores.mediartc.instance()

	const streams = React.useMemo(() => {
		const result = state.remoteProducers
			.filter((p) => p.kind === "video")
			.map((p) => ({
				id: p.id,
				userId: p.userId,
				isSelf: false,
				producer: p,
			}))

		if (state.isProducingScreen && rtc.self.screenStream) {
			result.push({
				id: `self-${app.userData._id}`,
				userId: app.userData._id,
				isSelf: true,
				stream: rtc.self.screenStream,
			})
		}
		return result
	}, [
		state.remoteProducers,
		state.isProducingScreen,
		state.clients,
		state.channelId,
	])

	React.useEffect(() => {
		const missingUserIds = streams
			.map((s) => s.userId)
			.filter((id) => !userData[id] && !fetchedUsersRef.current.has(id))

		if (missingUserIds.length > 0) {
			missingUserIds.forEach((id) => fetchedUsersRef.current.add(id))

			UsersModel.data({ user_id: missingUserIds }).then((data) => {
				const usersArray = Array.isArray(data) ? data : [data]

				setUserData((prev) => {
					const next = { ...prev }

					usersArray.forEach((u) => {
						if (u) {
							next[u._id] = u
						}
					})

					return next
				})
			})
		}
	}, [streams, userData])

	React.useEffect(() => {
		if (
			selectedStreamId &&
			!streams.find((s) => s.id === selectedStreamId)
		) {
			setSelectedStreamId(null)
		}
	}, [streams, selectedStreamId])

	const handleTileClick = React.useCallback((streamId) => {
		setSelectedStreamId((current) =>
			current === streamId ? null : streamId,
		)
	}, [])

	const streamActions = React.useMemo(
		() => ({ getVolume, setVolume }),
		[getVolume, setVolume],
	)

	React.useEffect(() => {
		if (!state.channel) {
			return
		}

		rtc.ui.detachFloatingScreens()

		return () => {
			if (state.channel) {
				rtc.ui.attachFloatingScreens()
			}
		}
	}, [state.channel, rtc])

	if (!state.channel) {
		return (
			<div className="channel-video-page channel-video-page--empty">
				<h1>join the channel to start</h1>
			</div>
		)
	}
	if (streams.length === 0) {
		return (
			<div className="channel-video-page channel-video-page--empty">
				<h2>no video streams available</h2>
			</div>
		)
	}

	const getGridLayout = (count) => {
		if (count <= 1) return { cols: 1, rows: 1 }
		if (count === 2) return { cols: 2, rows: 1 }
		if (count <= 4) return { cols: 2, rows: 2 }
		if (count <= 6) return { cols: 3, rows: 2 }
		if (count <= 9) return { cols: 3, rows: 3 }
		if (count <= 16) return { cols: 4, rows: 4 }
		return { cols: 4, rows: Math.ceil(count / 4) }
	}

	const isSingleStream = streams.length === 1
	const hasSidebar = !isSingleStream && selectedStreamId !== null

	const { cols, rows } = getGridLayout(streams.length)

	return (
		<motion.div className="channel-video-page">
			<div className="channel-video-page__content">
				<div
					className={classnames("video-grid", {
						"video-grid--with-sidebar": hasSidebar,
						"video-grid--single": isSingleStream,
					})}
					style={{ "--grid-cols": cols, "--grid-rows": rows }}
				>
					{streams.map((stream) => {
						let tileMode = "grid"

						if (isSingleStream) {
							tileMode = "single"
						} else if (hasSidebar) {
							tileMode =
								stream.id === selectedStreamId
									? "hero"
									: "preview"
						}

						return (
							<StreamTile
								key={stream.id}
								stream={stream}
								mode={tileMode}
								onTileClick={handleTileClick}
								onStreamAction={streamActions}
								userData={userData[stream.userId]}
							/>
						)
					})}
				</div>
			</div>
		</motion.div>
	)
}

VoiceChannel.options = { layout: { centeredContent: false, maxHeight: true } }

export default VoiceChannel
