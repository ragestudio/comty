import type { StatedChannel } from "@comty/shared/types/rtc/statedChannel"
import type { Group } from "@comty/shared/types/spaces/group"
import type { Channels } from "@comty/shared/types/spaces/channel"

import React from "react"
import { useLocalSearchParams } from "expo-router"
import { MessageSquareIcon, Volume2Icon } from "lucide-react-native"
import { View, StyleSheet, Image, GestureResponderEvent } from "react-native"
import { XStack, YStack } from "tamagui"
import { Skeleton, Chip } from "panelui-native"
import TextureBg from "@/ui/TextureBg"
import AppText from "@/ui/Text"
import TimeAgo from "@/components/TimeAgo"

import useApp from "@/engine/app"
import {
	subscribeGroupSocket,
	useGroupActions,
	useGroupChannels,
	useGroupData,
	useGroupError,
	useGroupLoading,
	useGroupRTC,
	useGroupStore,
} from "@/lib/spaces"

import { rtcService } from "@/lib/spaces/stores/rtc"

const GroupHeader = ({ data }: { data: Group | null }) => {
	if (!data) {
		return (
			<View className="flex-row items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<View className="flex-1 gap-2">
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-3 w-2/3" />
				</View>
			</View>
		)
	}

	return (
		<XStack
			width="100%"
			alignItems="center"
			gap={10}
			paddingVertical={5}
			paddingHorizontal={10}
		>
			<TextureBg
				borderRadius={12}
				borderWidth={1}
			/>
			<Image
				source={{
					uri: data.icon,
				}}
				width={50}
				height={50}
				borderRadius={12}
			/>
			<YStack gap={5}>
				<AppText>{data.name}</AppText>
				<Chip>
					<AppText type="mono">{data._id}</AppText>
				</Chip>
			</YStack>
		</XStack>
	)
}

const GroupChannels = ({
	channels,
	onPressChannel,
}: {
	channels: Channels
	onPressChannel?: (
		event: GestureResponderEvent,
		channel: (typeof channels.items)[0],
	) => void
}) => {
	const statedChannels = useGroupRTC()

	console.log({ statedChannels })

	if (!channels) {
		return (
			<View className="flex-row items-center gap-3">
				<View className="flex-1 gap-2">
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-3 w-2/3" />
				</View>
			</View>
		)
	}

	return (
		<YStack gap={5}>
			{channels.items.map((channel) => {
				const channelState = statedChannels?.[channel._id]

				return (
					<GroupChannel
						key={channel._id}
						channel={channel}
						onPress={onPressChannel}
						state={channelState}
					/>
				)
			})}
		</YStack>
	)
}

const GroupChannelsClients = ({
	clients,
}: {
	clients: StatedChannel["clients"]
}) => {
	return (
		<YStack>
			{clients.map((client) => {
				return (
					<YStack
						justifyContent="center"
						gap={5}
						padding={10}
					>
						<TextureBg
							borderRadius={8}
							borderWidth={1}
						/>
						<XStack
							alignItems="center"
							gap={5}
						>
							<Image
								width={25}
								height={25}
								source={{
									uri: client.user?.avatar,
								}}
							/>
							<AppText>{client.user?.username}</AppText>
						</XStack>
						<AppText>{client.userId}</AppText>
					</YStack>
				)
			})}
		</YStack>
	)
}

const GroupChannel = ({
	channel,
	state,
	onPress,
}: {
	channel: Channels["items"][0]
	state?: StatedChannel
	onPress?: (
		event: GestureResponderEvent,
		channel: Channels["items"][0],
	) => void
}) => {
	const handlePressed = (e: GestureResponderEvent) => {
		if (typeof onPress === "function") {
			onPress(e, channel)
		}
	}

	return (
		<YStack>
			<XStack
				minHeight={45}
				maxHeight={45}

				paddingVertical={5}
				paddingHorizontal={10}

				alignItems="center"
				gap={10}

				onPress={handlePressed}
			>
				<TextureBg
					borderRadius={12}
					borderWidth={1}
				/>

				{channel.kind === "voice" && <Volume2Icon />}
				{channel.kind === "chat" && <MessageSquareIcon />}

				<AppText fontSize={13}>{channel.name}</AppText>

				{state && state.started_at && (
					<AppText
						type="mono"
						fontSize={10}
						alignContent="flex-end"
					>
						<TimeAgo
							time={state.started_at}
							counterMode={true}
						/>
					</AppText>
				)}
			</XStack>

			{state && state.clients.length > 0 && (
				<GroupChannelsClients clients={state.clients} />
			)}
		</YStack>
	)
}

const GroupView = () => {
	const app = useApp()
	const params = useLocalSearchParams<{ group_id: string }>()

	const actions = useGroupActions()
	const loading = useGroupLoading()
	const error = useGroupError()
	const data = useGroupData()
	const channels = useGroupChannels()

	const handleOnPressChannel = (
		e: GestureResponderEvent,
		channel: (typeof channels.items)[0],
	) => {
		console.debug("GroupView::handleOnPressChannel", { e, channel })

		if (channel.kind === "voice") {
			rtcService.handlers.joinChannel(channel.group_id, channel._id)
			return
		}

		if (channel.kind === "chat") {
			return
		}
	}

	React.useEffect(() => {
		if (!params.group_id) return undefined

		actions.init(params.group_id)

		const cleanup = subscribeGroupSocket(params.group_id)

		return () => {
			cleanup()
			actions.reset()
		}
	}, [params.group_id])

	console.debug("GroupView::render", {
		group_id: params.group_id,
		data: data,
		channels: channels,
		loading: loading,
		error: error,
	})

	if (loading) {
		return (
			<YStack style={styles.container}>
				<View className="flex-row items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-full" />
					<View className="flex-1 gap-2">
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-3 w-2/3" />
					</View>
				</View>
			</YStack>
		)
	}

	return (
		<YStack
			style={styles.container}
			gap={15}
		>
			<GroupHeader data={data} />
			<GroupChannels
				channels={channels}
				onPressChannel={handleOnPressChannel}
			/>
		</YStack>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
	},
})

export default GroupView
