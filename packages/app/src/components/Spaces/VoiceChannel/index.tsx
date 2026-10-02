import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"

import StreamTile from "@components/Spaces/StreamTile"

import useMediaRTCState from "@hooks/useMediaRTCState"
import useHacks from "@/hooks/useHacks"
import UsersModel from "@models/user"

import "./index.less"

type VCItem = {
	type: "screen" | "user"
	id: string
	userId?: string
	isSelf?: boolean
	stream?: any
}

const VoiceChannel = () => {
	const state = useMediaRTCState()
	const [items, setItems] = React.useState<VCItem[]>([])
	const [selectedStreamId, setSelectedStreamId] = React.useState(null)
	const [userData, setUserData] = React.useState({})
	const fetchedUsersRef = React.useRef(new Set())

	const rtc = app.cores.mediartc.instance()

	const handleTileClick = React.useCallback((streamId) => {
		setSelectedStreamId((current) => (current === streamId ? null : streamId))
	}, [])

	React.useEffect(() => {
		const streams = state.remoteProducers
			.filter((p) => p.kind === "video")
			.map((p) => ({
				type: "screen",
				id: p.id,
				userId: p.userId,
				isSelf: false,
				producer: p,
			}))

		if (state.isProducingScreen && rtc.self.screenStream) {
			streams.push({
				type: "screen",
				id: `self-${app.userData._id}`,
				userId: app.userData._id,
				isSelf: true,
				stream: rtc.self.screenStream,
			})
		}

		console.log("computed screens:", {
			streams,
		})

		setItems((prev) => {
			return [...streams]
		})
	}, [
		state.remoteProducersCount,
		state.isProducingScreen,
		state.clients,
		state.channelId,
	])

	React.useEffect(() => {
		const missingUserIds = items
			.map((s) => s.userId)
			.filter((id) => !userData[id] && !fetchedUsersRef.current.has(id))

		if (missingUserIds.length > 0) {
			missingUserIds.forEach((id) => fetchedUsersRef.current.add(id))

			UsersModel.data({ user_id: missingUserIds.join(",") }).then((data) => {
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
	}, [items, userData])

	useHacks(
		{
			addMockScreen: () => {
				setItems((prev) => {
					return [
						...prev,
						{
							type: "screen",
							id: Date.now().toString(),
						},
					]
				})
			},
		},
		{
			namespace: "vc_view",
		},
	)

	React.useEffect(() => {
		if (selectedStreamId && !items.find((s) => s.id === selectedStreamId)) {
			setSelectedStreamId(null)
		}
	}, [items, selectedStreamId])

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
		return <div className="channel-video-page channel-video-page--empty"></div>
	}
	if (items.length === 0) {
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

	const isSingleStream = items.length === 1
	const hasSidebar = !isSingleStream && selectedStreamId !== null

	const { cols, rows } = getGridLayout(items.length)

	return (
		<motion.div className="channel-video-page">
			<div className="channel-video-page__content">
				<div
					className={classnames("video-grid", {
						"video-grid--with-sidebar": hasSidebar,
						"video-grid--single": isSingleStream,
					})}
					style={{
						// @ts-ignore
						"--grid-cols": cols,
						"--grid-rows": rows,
					}}
				>
					{items.map((item) => {
						let tileMode = "grid"

						if (isSingleStream) {
							tileMode = "single"
						} else if (hasSidebar) {
							tileMode = item.id === selectedStreamId ? "hero" : "preview"
						}

						return (
							<StreamTile
								key={item.id}
								stream={item}
								mode={tileMode}
								onTileClick={handleTileClick}
								userData={userData[item.userId]}
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
