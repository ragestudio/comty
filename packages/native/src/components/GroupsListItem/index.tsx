import type { Group } from "@comty/shared/types/spaces/group"

import { XStack, YStack } from "tamagui"
import { Image } from "react-native"
import Text from "@/ui/Text"
import TexturedBackground from "@/ui/TextureBg"

import type { GestureResponderEvent } from "react-native"

const GroupsListItem = ({
	group,
	onPress,
}: {
	group: Group
	onPress?: (event: GestureResponderEvent) => void
}) => {
	return (
		<XStack
			flex={1}
			gap={10}
			alignItems="center"
			paddingHorizontal={10}
			paddingVertical={5}
			minHeight={50}
			onPress={onPress}
		>
			<TexturedBackground
				borderRadius={12}
				borderWidth={1}
			/>

			{group.icon && (
				<Image
					source={{
						uri: group.icon,
					}}
					width={40}
					height={40}
					borderRadius={12}
				/>
			)}

			<YStack flex={1}>
				<Text
					fontWeight="bold"
					fontSize={14}
					lineHeight={21}
				>
					{group.name}
				</Text>
				{group.description && <Text type="small">{group.description}</Text>}
			</YStack>
		</XStack>
	)
}

export default GroupsListItem
