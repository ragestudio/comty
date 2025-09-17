import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"

import UserPreview from "@components/UserPreview"
import VideoGrid from "@components/VideoGrid"
import { motion } from "motion/react"
import classnames from "classnames"

import useMediaRTCState from "@hooks/useMediaRTCState"

import "./index.less"

const VideoStream = ({
	stream,
	userId,
	onStart,
	onStop,
	onDoubleClick,
	selected,
	speaking,
	noAudio,
}) => {
	const videoRef = React.useRef(null)
	const [started, setStarted] = React.useState(false)

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
			setStarted(true)
		} else {
			videoRef.current.srcObject = null
			setStarted(false)
		}
	}, [videoRef.current, stream])

	return (
		<motion.div
			id={userId}
			className={classnames("video-consumer", {
				["started"]: started,
				["selected"]: selected,
				["speaking"]: speaking,
			})}
			onDoubleClick={onDoubleClick}
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

const RemoteConsumer = ({ producer, onDoubleClick, selected, speaking }) => {
	const mediaStreamRef = React.useRef(producer.stream)
	const attachedConsumersIds = React.useRef([])

	// TODO:send to websocket
	const handleOnStart = async () => {
		if (producer.self) {
			return true
		}

		const stream = new MediaStream()

		const consumer = await app.cores.mediartc
			.instance()
			.consumers.start(producer)

		if (consumer) {
			if (consumer.paused) {
				consumer.resume()
			}

			attachedConsumersIds.current.push(consumer.id)

			stream.addTrack(consumer.track)

			if (producer.appData) {
				if (Array.isArray(producer.appData.childrens)) {
					for await (const childId of producer.appData.childrens) {
						const child = app.cores.mediartc
							.instance()
							.producers.get(childId)

						if (child) {
							const childConsumer = await app.cores.mediartc
								.instance()
								.consumers.start(child)

							if (childConsumer) {
								stream.addTrack(childConsumer.track)

								attachedConsumersIds.current.push(
									childConsumer.id,
								)
							}
						}
					}
				}
			}

			mediaStreamRef.current = stream
		}
	}

	// TODO:send to websocket
	const handleOnStop = () => {
		if (producer.self) {
			return false
		}

		for (const consumerId of attachedConsumersIds.current) {
			app.cores.mediartc.instance().consumers.stop(consumerId)
		}

		mediaStreamRef.current = null
	}

	return (
		<VideoStream
			stream={mediaStreamRef.current}
			userId={producer.userId}
			onStart={handleOnStart}
			onStop={handleOnStop}
			selected={selected}
			speaking={speaking}
			onDoubleClick={onDoubleClick}
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

	let producers = Array.from(rtcInstance.producers.values())

	// filter producers that not a video type
	producers = producers.filter((producer) => producer.kind === "video")
	// remove self producers
	producers = producers.filter((producer) => !producer.self)

	// put self screen video stream as a fake producer
	if (ownScreenStream && ownScreenShareProducer) {
		producers.push({
			self: true,
			id: ownScreenShareProducer?.id,
			kind: "video",
			userId: app.userData._id,
			stream: ownScreenStream,
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

	const handleClickBackToGroup = () => {
		if (state.channel.group_id) {
			app.location.push(`/groups/${state.channel.group_id}`)
		}
	}

	React.useEffect(() => {
		if (producers.length === 0) {
			if (focusedId) {
				setFocusedId(null)
			}
		}
	}, [producers])

	React.useEffect(() => {
		if (app.layout.sidebar) {
			if (focusedId) {
				app.layout.sidebar.toggleVisibility(false)
			} else {
				app.layout.sidebar.toggleVisibility(true)
			}
		}
	}, [focusedId])

	React.useEffect(() => {
		app.layout.toggleCompactMode(true)

		return () => {
			app.layout.toggleCompactMode(false)
		}
	}, [focusedId])

	if (!state.channel) {
		return (
			<div className="channel-video-page">
				<h1>Join a channel to start</h1>
			</div>
		)
	}

	// const selectedVideoConsumer = videoConsumers.find(
	// 	(consumer) => consumer.id === fucusedId,
	// )

	// console.log({
	// 	videoProducers: videoProducers,
	// 	ownScreenShareProducer: ownScreenShareProducer,
	// 	ownScreenStream: ownScreenStream,
	// 	state: state,
	// })

	console.log({ producers })

	return (
		<motion.div
			className={classnames("channel-video-page", {
				["focused"]: !!focusedId,
			})}
		>
			<div className="channel-video-page__header">
				{state.channel.group_id && (
					<div className="channel-video-page__header__nav_indicator">
						<h3 onClick={handleClickBackToGroup}>
							<Icons.ArrowLeft />
							{state.channel.group_id}
						</h3>
					</div>
				)}

				<h1>
					<Icons.Volume2 /> {state.channel.name}
				</h1>
			</div>

			<div className="channel-video-page__content">
				<VideoGrid focusedId={focusedId}>
					{producers.map((producer) => {
						const isSelected = focusedId === producer.producerId

						return (
							<RemoteConsumer
								key={producer.id}
								producer={producer}
								selected={isSelected}
								defaultStarted={isSelected || !focusedId}
								onDoubleClick={(e) => {
									e.stopPropagation()
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
