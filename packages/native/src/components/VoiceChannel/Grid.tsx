import type { SerializedScreen } from "@/rtc/screens/screen"
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native"

import React from "react"
import { View } from "react-native"
import { XStack, YStack } from "tamagui"

import { useGroupRTC } from "@comty/spaces-sdk/group"
import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"
import { useScreenFullscreen } from "@/components/ScreenFullscreen/store"

import clientName from "@/utils/clientName"

import ClientTile from "./ClientTile"
import ScreenPromptTile from "./ScreenPromptTile"
import ScreenViewTile from "./ScreenViewTile"

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
	const localStreamURL = rtc.localScreenStreamURL

	const items: GridItem[] = [
		...(localStreamURL ? [{ kind: "local" as const }] : []),
		...screens.map((screen) => ({ kind: "screen" as const, screen })),
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

	const handlePromptPress =
		(screen: SerializedScreen) => (event: GestureResponderEvent) => {
			event.stopPropagation()
			rtcService.screens.enable(screen.userId)
			setFocusedId(idOf({ kind: "screen", screen }))
		}

	const handleBackgroundPress = () => {
		if (focusedId !== null) setFocusedId(null)
	}

	const handleOnFullscreenItem = (item: GridItem) => {
		if (item.kind !== "screen" && item.kind !== "local") {
			return
		}

		const id = idOf(item)

		if (item.kind === "local" && localStreamURL) {
			fullscreen.open(id, {
				streamURL: localStreamURL,
				label: "Your screen",
				hasAudio: false,
				volume: 0,
			})
		}

		if (item.kind === "screen") {
			fullscreen.open(id, {
				streamURL: item.screen.streamURL,
				label: nameOf(item.screen.userId),
				hasAudio: item.screen.hasAudio,
				volume: item.screen.volume,
				onVolume: (value) =>
					rtcService.screens.setVolume(item.screen.userId, value),
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
			return (
				<ScreenViewTile
					key={id}
					width={width}
					height={height}
					streamURL={localStreamURL}
					label="Your screen"
					onStop={() => rtcService.self.destroyMedia("screen")}
					onExpand={() => handleOnFullscreenItem(item)}
					hidden={fullscreen.id === id}
					onPress={handleCardPress(id)}
				/>
			)
		}

		if (item.kind === "screen") {
			if (item.screen.enabled) {
				return (
					<ScreenViewTile
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
				<ScreenPromptTile
					key={id}
					width={width}
					height={height}
					label={nameOf(item.screen.userId)}
					onPress={handlePromptPress(item.screen)}
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
