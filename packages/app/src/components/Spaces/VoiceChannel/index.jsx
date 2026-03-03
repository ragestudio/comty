import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"
import Button from "@ui/Button"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import VideoGrid from "@components/VideoGrid"

import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const VideoStream = ({
	stream,
	userId,
	onStart,
	onStop,
	onClick,
	selected,
	speaking,
	noAudio,
}) => {
	const videoRef = React.useRef(null)

	const enterFullscreen = () => {
		if (videoRef.current) {
			videoRef.current.requestFullscreen()
		}
	}

	const handleStartVideo = async () => {
		videoRef.current.srcObject = null

		if (typeof onStart === "function") {
			await onStart()
		}
	}

	const handleStopVideo = async () => {
		videoRef.current.srcObject = null

		if (typeof onStop === "function") {
			await onStop()
		}
	}

	// Set up video element immediately when stream is available
	React.useEffect(() => {
		if (stream) {
			videoRef.current.srcObject = stream
			videoRef.current.muted = noAudio ?? false
			videoRef.current.volume = noAudio === true ? 0 : 1

			videoRef.current.play()
		} else {
			videoRef.current.srcObject = null
		}
	}, [videoRef.current, stream])

	const started = stream !== null

	return (
		<motion.div
			id={userId}
			className={classnames("video-consumer", {
				["started"]: started,
				["selected"]: selected,
				["speaking"]: speaking,
			})}
			onClick={onClick}
		>
			<div className="video-consumer__overlay">
				<div className="video-consumer__overlay__user">
					<UserPreview
						user_id={userId}
						small
					/>
				</div>

				{!started && (
					<div className="video-consumer__overlay__start">
						<Button
							onClick={(e) => {
								e.stopPropagation()
								handleStartVideo()
							}}
						>
							Start
						</Button>
					</div>
				)}

				<div className="video-consumer__overlay__controls">
					{started && (
						<Button
							icon={<Icons.Fullscreen />}
							onClick={(e) => {
								e.stopPropagation()
								enterFullscreen()
							}}
						/>
					)}
					{started && (
						<Button
							onClick={(e) => {
								e.stopPropagation()
								handleStopVideo()
							}}
						>
							Stop
						</Button>
					)}
				</div>
			</div>

			<video ref={videoRef} />
		</motion.div>
	)
}

const rtc = () => {
	return app.cores.mediartc.instance()
}

const RemoteConsumer = ({ producer, onClick, selected, speaking }) => {
	const [screen, setScreen] = React.useState(null)
	const [error, setError] = React.useState(null)

	// TODO:send to websocket
	const handleOnStart = async () => {
		setError(null)

		if (producer.self) {
			return true
		}

		try {
			const screenInstance = await rtc().screens.start(producer.id)

			setScreen(screenInstance)
		} catch (error) {
			setError(error)
		}
	}

	// TODO:send to websocket
	const handleOnStop = () => {
		setError(null)

		if (producer.self) {
			return true
		}

		if (screen) {
			screen.stop()
			setScreen(null)
		}
	}

	React.useEffect(() => {
		if (producer) {
			if (producer.self) {
				setScreen({
					media: producer.stream,
				})

				console.log("Setting self screen", producer.stream)

				return undefined
			}

			const targetScreen = rtc().screens.get(producer.userId)

			if (targetScreen) {
				setScreen(targetScreen)
			}
		}
	}, [])

	if (error) {
		return (
			<div className="video-consumer failed">
				<span>{error.message}</span>
				<Button
					onClick={(e) => {
						e.stopPropagation()
						handleOnStop()
					}}
				>
					Stop
				</Button>
			</div>
		)
	}

	return (
		<VideoStream
			stream={screen && screen.media}
			userId={producer.userId}
			onStart={handleOnStart}
			onStop={handleOnStop}
			selected={selected}
			speaking={speaking}
			onClick={onClick}
			noAudio={producer.self}
		/>
	)
}

const ChannelPage = () => {
	const state = useMediaRTCState()
	const [focusedId, setFocusedId] = React.useState(null)

	const rtcInstance = app.cores.mediartc.instance()

	const ownScreenStream = rtcInstance.self.screenStream
	const ownScreenShareProducer = rtcInstance.self.screenProducer
	const ownCameraStream = rtcInstance.self.camStream
	const ownCameraShareProducer = rtcInstance.self.camProducer

	// filter producers that not a video type
	let screensProducers = state.remoteProducers.filter(
		(producer) => producer.kind === "video",
	)

	// put self screen video stream as a fake producer
	if (ownScreenStream && state.ownScreenShareProducer) {
		screensProducers.push({
			self: true,
			id: ownScreenShareProducer?.id,
			kind: "video",
			userId: app.userData._id,
			stream: ownScreenStream,
		})
	}

	// put self camera video stream as a fake producer
	if (ownCameraStream && ownCameraShareProducer) {
		screensProducers.push({
			self: true,
			id: ownCameraShareProducer?.id,
			kind: "video",
			userId: app.userData._id,
			stream: ownCameraStream,
		})
	}

	const handleOnTileClick = (consumerId) => {
		if (focusedId === consumerId) {
			console.log("Exiting focus mode")
			setFocusedId(null)
		} else {
			console.log(`Focusing to ${consumerId}`)
			setFocusedId(consumerId)
		}
	}

	// if there is no producers, and there is a focusedId, then we should exit focus mode
	React.useEffect(() => {
		if (screensProducers.length === 0 && focusedId) {
			setFocusedId(null)
		}
	}, [screensProducers])

	// handle the previews
	React.useEffect(() => {
		if (state.channel) {
			rtc().ui.detachFloatingScreens()
		}

		return () => {
			if (state.channel) {
				rtc().ui.attachFloatingScreens()
			}
		}
	}, [])

	if (!state.channel) {
		return (
			<div className="channel-video-page">
				<h1>Join the channel to start</h1>
			</div>
		)
	}

	return (
		<motion.div
			className={classnames("channel-video-page", {
				["focused"]: !!focusedId,
			})}
		>
			<div className="channel-video-page__content">
				<VideoGrid focusedId={focusedId}>
					{screensProducers.map((producer) => {
						const isSelected = focusedId === producer.id

						return (
							<RemoteConsumer
								key={producer.id}
								producer={producer}
								selected={isSelected}
								onClick={(e) => {
									handleOnTileClick(producer.id)
								}}
							/>
						)
					})}
				</VideoGrid>
			</div>
		</motion.div>
	)
}

ChannelPage.options = {
	layout: {
		centeredContent: false,
		maxHeight: true,
	},
}

export default ChannelPage
