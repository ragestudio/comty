import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"
import Button from "@ui/Button"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import useMediaRTCState from "@hooks/useMediaRTCState"

import UsersModel from "@models/user"

import "./index.less"

const StreamTile = ({
	stream,
	userData,
	isFocused,
	hasFocusedStream,
	onTileClick,
	onStreamAction,
	onFullscreen,
}) => {
	const videoRef = React.useRef(null)
	const [isLoading, setIsLoading] = React.useState(false)
	const [hasError, setHasError] = React.useState(false)

	const rtc = app.cores.mediartc.instance()

	React.useEffect(() => {
		const videoElement = videoRef.current

		if (!videoElement) {
			return
		}

		if (stream.isSelf && stream.stream) {
			videoElement.srcObject = stream.stream
			videoElement.muted = true
			videoElement.play().catch(() => {})
			return
		}

		const screen = rtc.screens.get(stream.userId)

		if (screen?.media) {
			videoElement.srcObject = screen.media
			videoElement.play().catch(() => {})
			setIsLoading(false)
			setHasError(false)
		}

		return () => {
			if (videoElement) {
				videoElement.srcObject = null
			}
		}
	}, [isLoading, stream.id])

	const hasVideo = React.useCallback(() => {
		if (stream.isSelf) {
			return Boolean(stream.stream)
		}

		const screen = rtc.screens.get(stream.userId)

		return Boolean(screen?.media)
	}, [stream, rtc])

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
			} catch (error) {
				console.warn("failed to start stream:", error)
				setHasError(true)
			}

			setIsLoading(false)
		},
		[stream.id, stream.isSelf, stream.producer?.id, rtc],
	)

	const handleStop = React.useCallback(
		async (e) => {
			e.stopPropagation()

			if (stream.isSelf) {
				return
			}

			try {
				videoRef.current.srcObject = null

				const screen = rtc.screens.get(stream.userId)
				console.log("Stoping stream", stream, screen)

				if (screen) {
					await screen.stop()
				}
			} catch (error) {
				console.warn("failed to stop stream:", error)
			}

			const videoElement = videoRef.current

			if (videoElement) {
				videoElement.srcObject = null
			}
		},
		[stream.id, stream.isSelf, stream.userId, rtc],
	)

	const handleFullscreenClick = React.useCallback((e) => {
		e.stopPropagation()
		const videoElement = videoRef.current
		if (videoElement?.requestFullscreen) {
			videoElement.requestFullscreen()
		}
	}, [])

	const handleTileClick = React.useCallback(() => {
		onTileClick(stream.id)
	}, [stream.id, onTileClick])

	return (
		<motion.div
			key={stream.id}
			layout
			className={classnames("video-stream-tile", {
				"video-stream-tile--focused": isFocused,
				"video-stream-tile--preview": hasFocusedStream && !isFocused,
				"video-stream-tile--active": hasVideo,
				"video-stream-tile--error": hasError,
				"video-stream-tile--loading": isLoading,
			})}
			onClick={handleTileClick}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.3, type: "spring" }}
		>
			<div className="video-stream-tile__overlay">
				<div className="video-stream-tile__user">
					<UserPreview
						user={userData}
						small
						onClick={() => {}}
					/>
				</div>

				{hasError && (
					<div className="video-stream-tile__error">
						<span>failed to start stream</span>
						<Button
							onClick={(e) => {
								e.stopPropagation()
								setHasError(false)
							}}
						>
							dismiss
						</Button>
					</div>
				)}

				{!hasVideo() && !stream.isSelf && !hasError && !isLoading && (
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

				{hasVideo() && !hasError && (
					<div className="video-stream-tile__controls">
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
				muted={stream.isSelf}
				playsInline
			/>
		</motion.div>
	)
}

const VoiceChannel = () => {
	const state = useMediaRTCState()
	const [focusedStreamId, setFocusedStreamId] = React.useState(null)
	const [userData, setUserData] = React.useState({})

	const rtc = app.cores.mediartc.instance()

	const streams = React.useMemo(() => {
		const result = []

		const remoteProducers = state.remoteProducers.filter(
			(producer) => producer.kind === "video",
		)

		remoteProducers.forEach((producer) => {
			result.push({
				id: producer.id,
				userId: producer.userId,
				isSelf: false,
				producer,
			})
		})

		if (state.isProducingScreen && rtc.self.screenStream) {
			result.push({
				id: `self-${app.userData._id}`,
				userId: app.userData._id,
				isSelf: true,
				stream: rtc.self.screenStream,
			})
		}

		return result
	}, [state.remoteProducers, state.isProducingScreen, rtc])

	React.useEffect(() => {
		const usersIds = streams.map((stream) => stream.userId)

		UsersModel.data({ user_id: usersIds }).then((data) => {
			if (!Array.isArray(data)) {
				data = [data]
			}

			data = data.reduce((acc, user) => {
				acc[user._id] = user
				return acc
			}, {})

			setUserData(data)
		})
	}, [streams])

	const handleTileClick = React.useCallback((streamId) => {
		setFocusedStreamId((current) =>
			current === streamId ? null : streamId,
		)
	}, [])

	React.useEffect(() => {
		if (!state.channel) return

		rtc.ui.detachFloatingScreens()

		return () => {
			if (state.channel) {
				rtc.ui.attachFloatingScreens()
			}
		}
	}, [state.channel, rtc])

	React.useEffect(() => {
		if (streams.length === 0 && focusedStreamId) {
			setFocusedStreamId(null)
		}
	}, [streams.length, focusedStreamId])

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
		if (count <= 12) return { cols: 4, rows: 3 }
		if (count <= 16) return { cols: 4, rows: 4 }
		return { cols: 4, rows: Math.ceil(count / 4) }
	}

	const { cols, rows } = getGridLayout(streams.length)
	const hasFocusedStream = focusedStreamId !== null

	const focusedStream = hasFocusedStream
		? streams.find((s) => s.id === focusedStreamId)
		: null

	const otherStreams = hasFocusedStream
		? streams.filter((s) => s.id !== focusedStreamId)
		: streams

	return (
		<motion.div
			className={classnames("channel-video-page", {
				focused: hasFocusedStream,
			})}
		>
			<div className="channel-video-page__content">
				<div
					className={classnames("video-grid", {
						"video-grid--focused": hasFocusedStream,
					})}
					style={{
						"--grid-cols": cols,
						"--grid-rows": rows,
					}}
				>
					{hasFocusedStream ? (
						<div className="video-grid__focused-layout">
							<div className="video-grid__focused-container">
								{focusedStream && (
									<StreamTile
										key={focusedStream.id}
										stream={focusedStream}
										isFocused={true}
										hasFocusedStream={hasFocusedStream}
										onTileClick={handleTileClick}
										userData={
											userData[focusedStream.userId]
										}
									/>
								)}
							</div>

							{otherStreams.length > 0 && (
								<div className="video-grid__preview-bar">
									<div className="video-grid__preview-content">
										{otherStreams.map((stream) => (
											<StreamTile
												key={stream.id}
												stream={stream}
												isFocused={false}
												hasFocusedStream={
													hasFocusedStream
												}
												onTileClick={handleTileClick}
												userData={
													userData[stream.userId]
												}
											/>
										))}
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="video-grid__grid-container">
							{streams.map((stream) => (
								<StreamTile
									key={stream.id}
									stream={stream}
									isFocused={false}
									hasFocusedStream={hasFocusedStream}
									onTileClick={handleTileClick}
									userData={userData[stream.userId]}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	)
}

VoiceChannel.options = {
	layout: {
		centeredContent: false,
		maxHeight: true,
	},
}

export default VoiceChannel
