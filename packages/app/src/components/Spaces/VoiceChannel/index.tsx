import React from "react"
import classnames from "classnames"
import { motion } from "motion/react"

import StreamTile from "@components/Spaces/StreamTile"

import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"
import UsersModel from "@endpoints/user"

import "./index.less"

type VCItem = {
	type: "screen" | "camera"
	id: string
	userId?: string
	isSelf?: boolean
	mediaStream?: MediaStream | null
	volume?: number
	onStart?: () => void | Promise<void>
	onStop?: () => void | Promise<void>
	onVolume?: (value: number) => void
}

const VoiceChannel = () => {
	const rtc = useRTCStore()

	const [selectedStreamId, setSelectedStreamId] = React.useState(null)
	const [userData, setUserData] = React.useState({})
	const fetchedUsersRef = React.useRef(new Set())

	const selfId = app.userData?._id

	const items = React.useMemo<VCItem[]>(() => {
		const next: VCItem[] = []

		if (rtc.localScreenStream) {
			next.push({
				type: "screen",
				id: "local-screen",
				userId: selfId,
				isSelf: true,
				mediaStream: rtc.localScreenStream,
			})
		}

		if (rtc.localCameraStream) {
			next.push({
				type: "camera",
				id: "local-camera",
				userId: selfId,
				isSelf: true,
				mediaStream: rtc.localCameraStream,
			})
		}

		for (const screen of rtc.statedScreens ?? []) {
			next.push({
				type: "screen",
				id: `screen:${screen.userId}`,
				userId: screen.userId,
				isSelf: false,
				mediaStream: screen.enabled ? screen.stream : null,
				volume: screen.volume,
				onStart: () => rtcService.screens.enable(screen.userId),
				onStop: () => rtcService.screens.disable(screen.userId),
				onVolume: (value) => rtcService.screens.setVolume(screen.userId, value),
			})
		}

		for (const camera of rtc.statedCameras ?? []) {
			next.push({
				type: "camera",
				id: `camera:${camera.userId}`,
				userId: camera.userId,
				isSelf: false,
				mediaStream: camera.enabled ? camera.stream : null,
				onStart: () => rtcService.cameras.enable(camera.userId),
				onStop: () => rtcService.cameras.disable(camera.userId),
			})
		}

		return next
	}, [
		selfId,
		rtc.localScreenStream,
		rtc.localCameraStream,
		rtc.statedScreens,
		rtc.statedCameras,
	])

	const handleTileClick = React.useCallback((streamId) => {
		setSelectedStreamId((current) => (current === streamId ? null : streamId))
	}, [])

	React.useEffect(() => {
		const missingUserIds = items
			.map((s) => s.userId)
			.filter((id) => id && !userData[id] && !fetchedUsersRef.current.has(id))

		if (missingUserIds.length === 0) return

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
	}, [items, userData])

	React.useEffect(() => {
		if (selectedStreamId && !items.find((s) => s.id === selectedStreamId)) {
			setSelectedStreamId(null)
		}
	}, [items, selectedStreamId])

	if (!rtc.channel) {
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
