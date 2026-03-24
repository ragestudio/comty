import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"

import StreamTile from "@components/Spaces/StreamTile"

import useMediaRTCState from "@hooks/useMediaRTCState"

import UsersModel from "@models/user"

import "./index.less"

const VoiceChannel = () => {
	const state = useMediaRTCState()
	const [selectedStreamId, setSelectedStreamId] = React.useState(null)
	const [userData, setUserData] = React.useState({})
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
		state.remoteProducersCount,
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
