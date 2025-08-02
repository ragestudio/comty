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
							icon={<Icons.MdFullscreen />}
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
	const attachedProducersIds = React.useRef([])

	// TODO:send to websocket
	const handleOnStart = async () => {
		if (producer.self) {
			return true
		}

		const stream = new MediaStream()

		const videoConsumer = await app.cores.mediartc
			.instance()
			.handlers.startConsumer(producer)

		if (videoConsumer) {
			if (videoConsumer.paused) {
				videoConsumer.resume()
			}

			attachedProducersIds.current.push(videoConsumer.producerId)

			stream.addTrack(videoConsumer.track)

			if (producer.appData) {
				if (Array.isArray(producer.appData.childrens)) {
					for await (const childId of producer.appData.childrens) {
						const child = app.cores.mediartc
							.instance()
							.producers.get(childId)

						if (child) {
							const childConsumer = await app.cores.mediartc
								.instance()
								.handlers.startConsumer(child)

							if (childConsumer) {
								stream.addTrack(childConsumer.track)

								attachedProducersIds.current.push(
									childConsumer.producerId,
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

		for (const producerId of attachedProducersIds.current) {
			console.log("stopping consumer", producerId)
			app.cores.mediartc.instance().handlers.stopConsumer({
				producerId: producerId,
				userId: producer.userId,
			})
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

	const ownScreenStream = rtcInstance.screenStream
	const ownScreenShareProducer = rtcInstance.screenShareProducer

	const producers = Array.from(rtcInstance.producers.values())
	const videoProducers = producers.filter(
		(consumer) => consumer.kind === "video",
	)

	if (ownScreenStream && ownScreenShareProducer) {
		videoProducers.push({
			self: true,
			id: ownScreenShareProducer?.id,
			kind: "video",
			userId: app.userData._id,
			stream: ownScreenStream,
		})
	}

	const handleOnTileClick = (consumerId) => {
		if (focusedId === consumerId) {
			setFocusedId(null)
		} else {
			setFocusedId(consumerId)
		}
	}

	const handleClickBackToGroup = () => {
		if (state.channel.group_id) {
			app.location.push(`/groups/${state.channel.group_id}`)
		}
	}

	React.useEffect(() => {
		if (videoProducers.length === 0) {
			if (focusedId) {
				setFocusedId(null)
			}
		}
	}, [videoProducers])

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
							<Icons.FiArrowLeftCircle />
							{state.channel.group_id}
						</h3>
					</div>
				)}

				<h1>
					<Icons.FiVolume2 /> {state.channel.name}
				</h1>
			</div>

			{/*
			{selectedVideoConsumer && (
				<div className="channel-video-page__focused_consumer">
					<RemoteConsumer
						consumer={selectedVideoConsumer}
						onDoubleClick={() => handleOnDoubleClick(selectedVideoConsumer.id)}
						defaultStarted
						active
					/>
				</div>
			)} */}

			<div className="channel-video-page__content">
				<VideoGrid
					focusedId={focusedId}
					onTileClick={handleOnTileClick}
				>
					{videoProducers.map((producer) => {
						const isSelected = focusedId === producer.producerId
						const isSpeaking =
							state.speakingClients[producer.userId]

						return (
							<RemoteConsumer
								key={producer.id}
								producer={producer}
								selected={isSelected}
								speaking={isSpeaking}
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
	},
}

export default ChannelPage
