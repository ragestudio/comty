import React from "react"
import { motion } from "motion/react"

import StreamTile from "@components/Spaces/StreamTile"

import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"
import { useUser, usersActions } from "@comty/spaces-sdk/users"
import createBem from "@/utils/createBem"

import Grid, { type RenderGridItem, type TileModes } from "./grid"

import styles from "./index.module.less"

const b = createBem("channel_view", styles)

export type VoiceChannelItem = {
	type: "screen" | "camera" | "user"
	id: string
	userId?: string
	isSelf?: boolean
	mediaStream?: MediaStream | null
	volume?: number
	onStart?: () => void | Promise<void>
	onStop?: () => void | Promise<void>
	onVolume?: (value: number) => void
}

const VoiceChannelTile = ({
	item,
	tileMode,
	toggleItemFocus,
}: {
	item: VoiceChannelItem
	tileMode: TileModes
	toggleItemFocus: () => void
}) => {
	const user = useUser(item.userId)

	return (
		<StreamTile
			stream={item}
			userData={user?.username ? user : undefined}
			mode={tileMode}
			onTileClick={toggleItemFocus}
		/>
	)
}

const VoiceChannelGridItemRender: RenderGridItem<VoiceChannelItem> = (
	props,
) => {
	if (props.item.type === "screen" || props.item.type === "camera") {
		return (
			<VoiceChannelTile
				key={props.item.id}
				item={props.item}
				tileMode={props.tileMode}
				toggleItemFocus={props.toggleItemFocus}
			/>
		)
	}

	return null
}

const VoiceChannel = () => {
	const rtc = useRTCStore()

	const selfId = app.userData?._id

	const items = React.useMemo<VoiceChannelItem[]>(() => {
		const next: VoiceChannelItem[] = []

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

	React.useEffect(() => {
		if (app.userData?._id) {
			usersActions.setUsers([app.userData])
		}
	}, [app.userData?._id])

	return (
		<motion.div
			className={b({
				empty: items.length === 0 || !rtc.channel,
			})}
		>
			{!rtc.channel && <h2>Join the channel</h2>}
			{rtc.channel && items.length === 0 && <h2>Nothing here</h2>}

			{items.length > 0 && (
				<div className={b.elem("content")}>
					<Grid
						items={items}
						renderItem={VoiceChannelGridItemRender}
					/>
				</div>
			)}
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
