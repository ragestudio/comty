import type { Client } from "@comty/shared/types/rtc/client"
import type { SerializedScreen } from "@/rtc/screens/screen"
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native"

import React from "react"
import { Image, View } from "react-native"
import { RTCView } from "react-native-webrtc"
import { useTheme, XStack, YStack } from "tamagui"
import {
	HeadphoneOffIcon,
	Maximize2Icon,
	MicOffIcon,
	TvMinimalPlayIcon,
	XIcon,
} from "lucide-react-native"
import { Slider } from "panelui-native"

import { useGroupRTC } from "@comty/spaces-sdk/group"
import { rtcService, useRTCStore } from "@comty/spaces-sdk/rtc"

import AppText from "@/ui/Text"
import TextureBg from "@/ui/TextureBg"
import { ScreenFullscreenStore } from "@/stores/ScreenFullscreen"

const GAP = 10
const FOCUS_ASPECT = 9 / 16
const FOCUS_MAX_RATIO = 0.6
const FOCUS_BOTTOM_PADDING = 20
const FOCUS_OTHER_SCALE = 0.8

type PressHandler = (event: GestureResponderEvent) => void

const clientName = (client: Client) => client.user?.username ?? client.userId

type GridItem =
	| { kind: "local" }
	| { kind: "screen"; screen: SerializedScreen }
	| { kind: "client"; client: Client }

const idOf = (item: GridItem) => {
	if (item.kind === "local") return "local"
	if (item.kind === "screen") return `screen:${item.screen.userId}`
	return `client:${item.client.userId}`
}

const columnsFor = (count: number) => {
	if (count <= 2) return 1
	if (count <= 4) return 2
	return 3
}

const chunkRows = <T,>(items: T[], size: number): T[][] => {
	const rows: T[][] = []

	for (let index = 0; index < items.length; index += size) {
		rows.push(items.slice(index, index + size))
	}

	return rows
}

const TileFrame = ({
	width,
	height,
	active,
	onPress,
	children,
}: {
	width: number
	height: number
	active?: boolean
	onPress?: PressHandler
	children: React.ReactNode
}) => (
	<YStack
		width={width}
		height={height}
		borderRadius={24}
		overflow="hidden"
		alignItems="center"
		justifyContent="center"
		gap={8}
		padding={8}
		onPress={onPress}
	>
		<TextureBg
			blurIntensity={0}
			borderRadius={24}
			borderWidth={active ? 2 : 1}
			borderColor={active ? "$productColor" : "$borderColor"}
		/>
		{children}
	</YStack>
)

const TileButton = ({
	onPress,
	children,
}: {
	onPress: PressHandler
	children: React.ReactNode
}) => (
	<YStack
		width={28}
		height={28}
		alignItems="center"
		justifyContent="center"
		borderRadius={14}
		backgroundColor="rgba(0,0,0,0.5)"
		onPress={onPress}
	>
		{children}
	</YStack>
)

const ClientTile = ({
	client,
	speaking,
	width,
	height,
	onPress,
}: {
	client: Client
	speaking: boolean
	width: number
	height: number
	onPress: PressHandler
}) => {
	const theme = useTheme()

	const avatarSize = Math.round(Math.min(width, height) * 0.4)

	return (
		<TileFrame
			width={width}
			height={height}
			active={speaking}
			onPress={onPress}
		>
			<Image
				source={{ uri: client.user?.avatar }}
				style={{
					width: avatarSize,
					height: avatarSize,
					borderRadius: avatarSize / 2,
					backgroundColor: theme.bgAccentSolid?.val,
				}}
			/>

			<XStack
				alignItems="center"
				gap={4}
				maxWidth="100%"
			>
				{client.voiceState?.muted && (
					<MicOffIcon
						size={12}
						color={theme.colorError?.val}
					/>
				)}
				{client.voiceState?.deafen && (
					<HeadphoneOffIcon
						size={12}
						color={theme.colorError?.val}
					/>
				)}
				<AppText
					fontSize={12}
					numberOfLines={1}
				>
					{clientName(client)}
				</AppText>
			</XStack>
		</TileFrame>
	)
}

const ScreenPromptTile = ({
	width,
	height,
	label,
	onPress,
}: {
	width: number
	height: number
	label: string
	onPress: PressHandler
}) => {
	const theme = useTheme()

	return (
		<TileFrame
			width={width}
			height={height}
			onPress={onPress}
		>
			<TvMinimalPlayIcon
				size={26}
				color={theme.productColor.val}
			/>

			<YStack
				alignItems="center"
				gap={2}
				maxWidth="100%"
			>
				<AppText
					fontSize={12}
					numberOfLines={1}
				>
					{label}
				</AppText>
				<AppText
					fontSize={10}
					opacity={0.5}
				>
					tap to watch
				</AppText>
			</YStack>
		</TileFrame>
	)
}

const ScreenViewTile = ({
	width,
	height,
	streamURL,
	label,
	hasAudio,
	volume,
	onVolume,
	onStop,
	onExpand,
	onPress,
	hidden,
}: {
	width: number
	height: number
	streamURL: string | null
	label: string
	hasAudio?: boolean
	volume?: number
	onVolume?: (value: number) => void
	onStop: () => void
	onExpand?: () => void
	onPress: PressHandler
	hidden?: boolean
}) => {
	const theme = useTheme()

	return (
		<YStack
			width={width}
			height={height}
			borderRadius={12}
			overflow="hidden"
			backgroundColor="black"
			justifyContent="center"
			onPress={onPress}
		>
			{hidden ? null : streamURL ? (
				<RTCView
					key={streamURL}
					streamURL={streamURL}
					objectFit="contain"
					style={{ flex: 1 }}
				/>
			) : (
				<XStack
					alignItems="center"
					justifyContent="center"
					gap={8}
				>
					<TvMinimalPlayIcon
						size={20}
						color={theme.textColor?.val}
					/>
					<AppText
						fontSize={13}
						opacity={0.7}
					>
						connecting...
					</AppText>
				</XStack>
			)}

			<View
				style={{
					position: "absolute",
					top: 6,
					left: 6,
					maxWidth: width - (onExpand ? 76 : 50),
				}}
			>
				<XStack
					alignItems="center"
					gap={4}
					paddingVertical={3}
					paddingHorizontal={6}
					borderRadius={6}
					backgroundColor="rgba(0,0,0,0.5)"
				>
					<AppText
						fontSize={11}
						numberOfLines={1}
					>
						{label}
					</AppText>
				</XStack>
			</View>

			<View style={{ position: "absolute", top: 6, right: 6 }}>
				<XStack gap={6}>
					{onExpand && (
						<TileButton
							onPress={(event) => {
								event.stopPropagation()
								onExpand()
							}}
						>
							<Maximize2Icon
								size={14}
								color={theme.textColor?.val}
							/>
						</TileButton>
					)}

					<TileButton
						onPress={(event) => {
							event.stopPropagation()
							onStop()
						}}
					>
						<XIcon
							size={14}
							color={theme.textColor?.val}
						/>
					</TileButton>
				</XStack>
			</View>

			{hasAudio && onVolume && (
				<View
					style={{
						position: "absolute",
						left: 6,
						right: 6,
						bottom: 6,
						paddingHorizontal: 8,
						paddingVertical: 2,
						borderRadius: 8,
						backgroundColor: "rgba(0,0,0,0.5)",
					}}
				>
					<Slider
						size="sm"
						min={0}
						max={100}
						step={1}
						defaultValue={volume}
						onValueCommit={onVolume}
						haptics
					/>
				</View>
			)}
		</YStack>
	)
}

const ChannelGrid = () => {
	const rtc = useRTCStore()
	const channelState = useGroupRTC()
	const [area, setArea] = React.useState({ width: 0, height: 0 })
	const [focusedId, setFocusedId] = React.useState<string | null>(null)
	const [fullscreenId, setFullscreenId] = React.useState<string | null>(null)

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
					onExpand={() => setFullscreenId(id)}
					hidden={fullscreenId === id}
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
						onExpand={() => setFullscreenId(id)}
						hidden={fullscreenId === id}
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

	const fullscreenItem = fullscreenId
		? items.find((item) => idOf(item) === fullscreenId)
		: null

	const isFullscreen =
		(fullscreenItem?.kind === "local" && !!localStreamURL) ||
		(fullscreenItem?.kind === "screen" && fullscreenItem.screen.enabled)

	React.useEffect(() => {
		const store = ScreenFullscreenStore.getState()

		if (!isFullscreen) {
			store.close()
			return
		}

		if (fullscreenItem?.kind === "local" && localStreamURL) {
			store.open({
				streamURL: localStreamURL,
				label: "Your screen",
				hasAudio: false,
				volume: 0,
				onClose: () => setFullscreenId(null),
			})
			return
		}

		if (fullscreenItem?.kind === "screen") {
			const userId = fullscreenItem.screen.userId

			store.open({
				streamURL: fullscreenItem.screen.streamURL,
				label: nameOf(userId),
				hasAudio: fullscreenItem.screen.hasAudio,
				volume: fullscreenItem.screen.volume,
				onVolume: (value) => rtcService.screens.setVolume(userId, value),
				onClose: () => setFullscreenId(null),
			})
		}
	}, [isFullscreen])

	React.useEffect(() => {
		return () => ScreenFullscreenStore.getState().close()
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
			{focused ? (
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
			) : (
				renderRows(items, columns, normalCell)
			)}
		</YStack>
	)
}

export default ChannelGrid
