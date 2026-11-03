import type { PressHandler } from "@/types"
import type { Client } from "@comty/shared/types/rtc/client"

import React from "react"
import { Image } from "react-native"
import AppText from "@/ui/Text"
import { MicOffIcon, HeadphoneOffIcon } from "lucide-react-native"
import { useTheme, XStack, YStack } from "tamagui"
import clientName from "@/utils/clientName"

import TileFrame from "./TileFrame"

export const ClientTile = ({
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

	const name = clientName(client)
	const avatar = client.user?.avatar
	const avatarSize = Math.round(Math.min(width, height) * 0.4)

	const initials = React.useMemo(
		() => name.trim().slice(0, 2).toUpperCase() || "?",
		[name],
	)

	return (
		<TileFrame
			width={width}
			height={height}
			active={speaking}
			onPress={onPress}
		>
			{avatar ? (
				<Image
					source={{ uri: avatar }}
					style={{
						width: avatarSize,
						height: avatarSize,
						borderRadius: avatarSize / 2,
						backgroundColor: theme.bgAccentSolid?.val,
					}}
				/>
			) : (
				<YStack
					width={avatarSize}
					height={avatarSize}
					borderRadius={avatarSize / 2}
					alignItems="center"
					justifyContent="center"
					backgroundColor="$bgAccentSolid"
				>
					<AppText fontSize={Math.round(avatarSize * 0.32)}>{initials}</AppText>
				</YStack>
			)}

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
					{name}
				</AppText>
			</XStack>
		</TileFrame>
	)
}

export default React.memo(ClientTile)
