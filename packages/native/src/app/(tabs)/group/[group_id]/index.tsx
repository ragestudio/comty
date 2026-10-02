import type { Group } from "@comty/shared/types/spaces/group"
import type { Channels } from "@comty/shared/types/spaces/channel"

import AppText from "@/ui/Text"
import { useLocalSearchParams } from "expo-router"
import React from "react"
import { View, StyleSheet, Image, StyleProp } from "react-native"
import { XStack, XStackProps, YStack } from "tamagui"
import { Skeleton, Card, Button, Item, Chip } from "panelui-native"

import useApp from "@/engine/app"
import {
	useGroupActions,
	useGroupChannels,
	useGroupData,
	useGroupError,
	useGroupLoading,
	useGroupStore,
} from "@/lib/spaces"
import TextureBg from "@/ui/TextureBg"
import { MessageSquareIcon, Volume2Icon } from "lucide-react-native"
import AppIcon from "@/ui/Icon"

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

const GroupChannels = ({ channels }: { channels: Channels }) => {
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
				return (
					<GroupChannel
						key={channel._id}
						channel={channel}
					/>
				)
			})}
		</YStack>
	)
}

const GroupChannel = ({ channel }: { channel: Channels["items"][0] }) => {
	return (
		<XStack
			minHeight={45}
			maxHeight={45}

			paddingVertical={5}
			paddingHorizontal={10}

			alignItems="center"
			gap={10}
		>
			<TextureBg
				borderRadius={12}
				borderWidth={1}
			/>
			{channel.kind === "voice" && <Volume2Icon />}
			{channel.kind === "chat" && <MessageSquareIcon />}
			<AppText fontSize={13}>{channel.name}</AppText>
		</XStack>
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

	React.useEffect(() => {
		if (!params.group_id) return undefined

		actions.init(params.group_id)
	}, [params.group_id])

	console.log("GROUP RENDER:", {
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
			<GroupChannels channels={channels} />
		</YStack>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
	},
})

export default GroupView
