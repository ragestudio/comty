import type { PressHandler } from "@/types"
import type { Client } from "@comty/shared/types/rtc/client"

import { Image } from "react-native"
import AppText from "@/ui/Text"
import { MicOffIcon, HeadphoneOffIcon } from "lucide-react-native"
import { useTheme, XStack } from "tamagui"
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

export default ClientTile
