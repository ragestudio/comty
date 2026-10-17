import type { SerializedRemoteMedia } from "@comty/spaces-sdk/rtc"
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native"

import React from "react"
import { View } from "react-native"
import { XStack, YStack } from "tamagui"

import { useGroupRTC } from "@comty/spaces-sdk/group"
import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"
import { useScreenFullscreen } from "@/components/ScreenFullscreen/store"

import clientName from "@/utils/clientName"

import ClientTile from "./ClientTile"
import VideoPromptTile from "./VideoPromptTile"
import VideoViewTile from "./VideoViewTile"

import { chunkRows, columnsFor, idOf } from "./utils"
import {
	FOCUS_ASPECT,
	FOCUS_BOTTOM_PADDING,
	FOCUS_MAX_RATIO,
	FOCUS_OTHER_SCALE,
	GAP,
	GridItem,
} from "./constants"

const ChannelGrid = () => {
	const rtc = useRTCStore()
	const channelState = useGroupRTC()
	const fullscreen = useScreenFullscreen()

	const [area, setArea] = React.useState({ width: 0, height: 0 })
	const [focusedId, setFocusedId] = React.useState<string | null>(null)

	const channelId = rtc.channel?._id
	const clients =
		(channelId ? channelState[channelId]?.clients : undefined) ?? []
	const speaking = rtc.speakingClients ?? []

	const screens = rtc.statedScreens ?? []
	const cameras = rtc.statedCameras ?? []
	const localScreenStreamURL = rtc.localScreenStreamURL
	const localCameraStreamURL = rtc.localCameraStreamURL

	const items: GridItem[] = [
		...(localScreenStreamURL
			? [{ kind: "local" as const, media: "screen" as const }]
			: []),
		...screens.map((screen) => ({ kind: "screen" as const, screen })),
		...(localCameraStreamURL
			? [{ kind: "local" as const, media: "camera" as const }]
			: []),
		...cameras.map((camera) => ({ kind: "camera" as const, camera })),
		...clients.map((client) => ({ kind: "client" as const, client })),
	]

	const columns = columnsFor(items.length)
	const maxCell = area.width > 0 ? (area.width - GAP) / 2 : 0

	const normalCell = React.useMemo(() => {
		if (area.width <= 0 || items.length === 0) return 0

		const rowCount = Math.ceil(items.length / columns)
		const cellW = (area.width - GAP * (columns - 1)) / columns
		const cellH =
			area.height > 0 ? (area.height - GAP * (rowCount - 1)) / rowCount : cellW

		return Math.max(0, Math.min(cellW, cellH, maxCell))
	}, [area.width, area.height, items.length, columns, maxCell])

	const focusedIndex = items.findIndex((item) => idOf(item) === focusedId)
	const focused = focusedIndex >= 0 ? items[focusedIndex] : null

	const nameOf = (userId: string) => {
		const client = clients.find((c) => c.userId === userId)
		return client ? clientName(client) : userId
	}

	const handleCardPress = (id: string) => (event: GestureResponderEvent) => {
		event.stopPropagation()
		setFocusedId((prev) => (prev === id ? null : id))
	}

	const handleScreenPromptPress =
		(screen: SerializedRemoteMedia) => (event: GestureResponderEvent) => {
			event.stopPropagation()
			rtcService.screens.enable(screen.userId)
			setFocusedId(idOf({ kind: "screen", screen }))
		}

	const handleCameraPromptPress =
		(camera: SerializedRemoteMedia) => (event: GestureResponderEvent) => {
			event.stopPropagation()
			rtcService.cameras.enable(camera.userId)
			setFocusedId(idOf({ kind: "camera", camera }))
		}

	const handleBackgroundPress = () => {
		if (focusedId !== null) setFocusedId(null)
	}

	const handleOnFullscreenItem = (item: GridItem) => {
		if (item.kind === "local") {
			const id = idOf(item)
			const isScreen = item.media === "screen"
			const streamURL = isScreen ? localScreenStreamURL : localCameraStreamURL

			if (!streamURL) return

			fullscreen.open(id, {
				streamURL,
				label: isScreen ? "Your screen" : "Your camera",
				hasAudio: false,
				volume: 0,
			})

			return
		}

		if (item.kind === "screen") {
			fullscreen.open(idOf(item), {
				streamURL: item.screen.streamURL,
				label: nameOf(item.screen.userId),
				hasAudio: item.screen.hasAudio,
				volume: item.screen.volume,
				onVolume: (value) =>
					rtcService.screens.setVolume(item.screen.userId, value),
			})

			return
		}

		if (item.kind === "camera") {
			fullscreen.open(idOf(item), {
				streamURL: item.camera.streamURL,
				label: nameOf(item.camera.userId),
				hasAudio: item.camera.hasAudio,
				volume: item.camera.volume,
			})
		}
	}

	const onLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout

		if (width !== area.width || height !== area.height) {
			setArea({ width, height })
		}
	}

	const buildTile = (item: GridItem, width: number, height: number) => {
		const id = idOf(item)

		if (item.kind === "local") {
			const isScreen = item.media === "screen"

			return (
				<VideoViewTile
					key={id}
					width={width}
					height={height}
					streamURL={isScreen ? localScreenStreamURL : localCameraStreamURL}
					label={isScreen ? "Your screen" : "Your camera"}
					onStop={() =>
						rtcService.self.destroyMedia(isScreen ? "screen" : "cam")
					}
					onExpand={() => handleOnFullscreenItem(item)}
					hidden={fullscreen.id === id}
					onPress={handleCardPress(id)}
				/>
			)
		}

		if (item.kind === "screen") {
			if (item.screen.enabled) {
				return (
					<VideoViewTile
						key={id}
						width={width}
						height={height}
						streamURL={item.screen.streamURL}
						label={nameOf(item.screen.userId)}
						hasAudio={item.screen.hasAudio}
						volume={item.screen.volume}
						onVolume={(value) =>
							rtcService.screens.setVolume(item.screen.userId, value)
						}
						onStop={() => {
							rtcService.screens.disable(item.screen.userId)
							setFocusedId((prev) => (prev === id ? null : prev))
						}}
						onExpand={() => handleOnFullscreenItem(item)}
						hidden={fullscreen.id === id}
						onPress={handleCardPress(id)}
					/>
				)
			}

			return (
				<VideoPromptTile
					key={id}
					width={width}
					height={height}
					label={nameOf(item.screen.userId)}
					onPress={handleScreenPromptPress(item.screen)}
				/>
			)
		}

		if (item.kind === "camera") {
			if (item.camera.enabled) {
				return (
					<VideoViewTile
						key={id}
						width={width}
						height={height}
						streamURL={item.camera.streamURL}
						label={nameOf(item.camera.userId)}
						onStop={() => {
							rtcService.cameras.disable(item.camera.userId)
							setFocusedId((prev) => (prev === id ? null : prev))
						}}
						onExpand={() => handleOnFullscreenItem(item)}
						hidden={fullscreen.id === id}
						onPress={handleCardPress(id)}
					/>
				)
			}

			return (
				<VideoPromptTile
					key={id}
					width={width}
					height={height}
					label={nameOf(item.camera.userId)}
					hint="tap to view"
					onPress={handleCameraPromptPress(item.camera)}
				/>
			)
		}

		return (
			<ClientTile
				key={id}
				client={item.client}
				speaking={
					speaking.includes(item.client.userId) ||
					(!!item.client.self && rtc.isSpeaking)
				}
				width={width}
				height={height}
				onPress={handleCardPress(id)}
			/>
		)
	}

	const renderRows = (group: GridItem[], groupColumns: number, cell: number) =>
		chunkRows(group, groupColumns).map((row, rowIndex) => (
			<XStack
				key={rowIndex}
				justifyContent="center"
				gap={GAP}
			>
				{row.map((item) => buildTile(item, cell, cell))}
			</XStack>
		))

	// Safe guardrail if there are a fullscreen payload but no id applied
	React.useEffect(() => {
		if (!fullscreen.id && fullscreen.payload) {
			fullscreen.close()
			return
		}
	}, [fullscreen])

	// force close fullscreen if grid is unmounted
	React.useEffect(() => {
		return () => fullscreen.close()
	}, [])

	if (items.length === 0) {
		return null
	}

	const others = focused
		? items.filter((_, index) => index !== focusedIndex)
		: []

	const focusWidth = area.width
	const bottomPadding = focused ? FOCUS_BOTTOM_PADDING : 0
	const contentHeight = Math.max(0, area.height - bottomPadding)
	const focusHeight = Math.min(
		area.width * FOCUS_ASPECT,
		contentHeight * FOCUS_MAX_RATIO,
	)

	let otherCell = 0

	if (focused && others.length > 0 && area.width > 0) {
		const cellW = (area.width - GAP * (others.length - 1)) / others.length
		const cellH = (contentHeight - focusHeight) / 2 - GAP
		const otherMax = maxCell * FOCUS_OTHER_SCALE

		otherCell = Math.max(0, Math.min(cellW, cellH, otherMax))
	}

	return (
		<YStack
			flex={1}
			justifyContent="center"
			gap={GAP}
			paddingBottom={bottomPadding}
			onLayout={onLayout}
			onPress={handleBackgroundPress}
		>
			{focused && (
				<>
					{buildTile(focused, focusWidth, focusHeight)}

					{others.length > 0 && (
						<View
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								bottom: FOCUS_BOTTOM_PADDING,
							}}
						>
							<XStack
								justifyContent="center"
								gap={GAP}
							>
								{others.map((item) => buildTile(item, otherCell, otherCell))}
							</XStack>
						</View>
					)}
				</>
			)}

			{!focused && renderRows(items, columns, normalCell)}
		</YStack>
	)
}

export default ChannelGrid
