import type { Group } from "@comty/shared/types/spaces/group"
import type { GestureResponderEvent } from "react-native"

import { XStack, YStack, YStackProps } from "tamagui"
import { Image } from "react-native"
import Text from "@/ui/Text"
import TexturedBackground from "@/ui/TextureBg"
import ButtonIcon from "@/ui/ButtonIcon"

import { BuildingComplexIcon } from "lucide-react-native"

const GroupsListItem = ({
	group,
	onPress,
	onlyIcon,
}: {
	group: Group
	onPress?: (event: GestureResponderEvent) => void
	onlyIcon?: boolean
}) => {
	return (
		<XStack
			gap={10}
			alignItems="center"
			justifyContent="center"
			paddingHorizontal={onlyIcon ? 0 : 10}
			paddingVertical={onlyIcon ? 0 : 5}
			onPress={onPress}
		>
			{!onlyIcon && (
				<TexturedBackground
					borderRadius={12}
					borderWidth={1}
				/>
			)}

			<ButtonIcon
				width={45}
				height={45}
				icon={
					group.icon && (
						<Image
							source={{
								uri: group.icon,
							}}
							style={{
								width: "100%",
								height: "100%",
							}}
						/>
					)
				}
				fallback={<BuildingComplexIcon />}
			/>

			{!onlyIcon && (
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
			)}
		</XStack>
	)
}

export default GroupsListItem
