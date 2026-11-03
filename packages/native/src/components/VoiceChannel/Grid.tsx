import type { SerializedRemoteMedia } from "@comty/spaces-sdk/rtc"
import type { Client } from "@comty/shared/types/rtc/client"
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native"

import React from "react"
import { View } from "react-native"
import { XStack, YStack } from "tamagui"
import { useShallow } from "zustand/react/shallow"

import { useGroupStatedChannel } from "@comty/spaces-sdk/group"
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

const EMPTY_CLIENTS: Client[] = []

const ChannelGrid = () => {
	const {
		channel,
		screens,
		cameras,
		speakingClients,
		isSpeaking,
		localScreenStreamURL,
		localCameraStreamURL,
	} = useRTCStore(
		useShallow((state) => ({
			channel: state.channel,
			screens: state.statedScreens,
			cameras: state.statedCameras,
			speakingClients: state.speakingClients,
			isSpeaking: state.isSpeaking,
			localScreenStreamURL: state.localScreenStreamURL,
			localCameraStreamURL: state.localCameraStreamURL,
		})),
	)

	const fullscreen = useScreenFullscreen()

	const channelId = channel?._id
	const groupChannel = useGroupStatedChannel(channelId)
	const clients = groupChannel?.clients ?? EMPTY_CLIENTS

	const selfUserId = rtcService.userId

	const [area, setArea] = React.useState({ width: 0, height: 0 })
	const [focusedId, setFocusedId] = React.useState<string | null>(null)

	const items = React.useMemo<GridItem[]>(() => {
		const next: GridItem[] = []

		if (localScreenStreamURL) {
			next.push({ kind: "local", media: "screen" })
		}

		for (const screen of screens) {
			next.push({ kind: "screen", screen })
		}

		if (localCameraStreamURL) {
			next.push({ kind: "local", media: "camera" })
		}

		for (const camera of cameras) {
			next.push({ kind: "camera", camera })
		}

		for (const client of clients) {
			next.push({ kind: "client", client })
		}

		return next
	}, [localScreenStreamURL, localCameraStreamURL, screens, cameras, clients])

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

	const nameOf = React.useCallback(
		(userId: string) => {
			const client = clients.find((item) => item.userId === userId)

			return client ? clientName(client) : userId
		},
		[clients],
	)

	const handleCardPress = React.useCallback(
		(id: string) => (event: GestureResponderEvent) => {
			event.stopPropagation()
			setFocusedId((prev) => (prev === id ? null : id))
		},
		[],
	)

	const handleScreenPromptPress = React.useCallback(
		(screen: SerializedRemoteMedia) => (event: GestureResponderEvent) => {
			event.stopPropagation()

			rtcService.screens.enable(screen.userId).catch(console.error)
			setFocusedId(idOf({ kind: "screen", screen }))
		},
		[],
	)

	const handleCameraPromptPress = React.useCallback(
		(camera: SerializedRemoteMedia) => (event: GestureResponderEvent) => {
			event.stopPropagation()

			rtcService.cameras.enable(camera.userId).catch(console.error)
			setFocusedId(idOf({ kind: "camera", camera }))
		},
		[],
	)

	const handleBackgroundPress = React.useCallback(() => {
		setFocusedId(null)
	}, [])

	const handleOnFullscreenItem = React.useCallback(
		(item: GridItem) => {
			if (item.kind === "local") {
				const isScreen = item.media === "screen"
				const streamURL = isScreen ? localScreenStreamURL : localCameraStreamURL

				if (!streamURL) return

				fullscreen.open(idOf(item), {
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
					hasAudio: false,
					volume: 0,
				})
			}
		},
		[fullscreen, localScreenStreamURL, localCameraStreamURL, nameOf],
	)

	const onLayout = React.useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout

		setArea((prev) => {
			if (prev.width === width && prev.height === height) return prev

			return { width, height }
		})
	}, [])

	const handleStopLocal = React.useCallback((media: "screen" | "camera") => {
		rtcService.self
			.destroyMedia(media === "screen" ? "screen" : "cam")
			.catch(console.error)
	}, [])

	const handleStopScreen = React.useCallback((userId: string) => {
		rtcService.screens.disable(userId).catch(console.error)
	}, [])

	const handleStopCamera = React.useCallback((userId: string) => {
		rtcService.cameras.disable(userId).catch(console.error)
	}, [])

	const handleScreenVolume = React.useCallback(
		(userId: string, value: number) => {
			rtcService.screens.setVolume(userId, value)
		},
		[],
	)

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
					onStop={() => handleStopLocal(item.media)}
					onExpand={() => handleOnFullscreenItem(item)}
					hidden={fullscreen.id === id}
					onPress={handleCardPress(id)}
				/>
			)
		}

		if (item.kind === "screen") {
			const userId = item.screen.userId

			if (item.screen.enabled) {
				return (
					<VideoViewTile
						key={id}
						width={width}
						height={height}
						streamURL={item.screen.streamURL}
						label={nameOf(userId)}
						hasAudio={item.screen.hasAudio}
						volume={item.screen.volume}
						onVolume={(value) => handleScreenVolume(userId, value)}
						onStop={() => {
							handleStopScreen(userId)
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
					label={nameOf(userId)}
					onPress={handleScreenPromptPress(item.screen)}
				/>
			)
		}

		if (item.kind === "camera") {
			const userId = item.camera.userId

			if (item.camera.enabled) {
				return (
					<VideoViewTile
						key={id}
						width={width}
						height={height}
						streamURL={item.camera.streamURL}
						label={nameOf(userId)}
						onStop={() => {
							handleStopCamera(userId)
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
					label={nameOf(userId)}
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
					speakingClients.includes(item.client.userId) ||
					(item.client.userId === selfUserId && isSpeaking)
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

	// safe guardrail if there is a fullscreen payload but no id applied
	React.useEffect(() => {
		if (!fullscreen.id && fullscreen.payload) {
			fullscreen.close()
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
