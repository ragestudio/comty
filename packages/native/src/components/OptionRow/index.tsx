import React from "react"
import AppText from "@/ui/Text"
import { View, XStack } from "tamagui"

export const OptionRow = ({
	label,
	icon,
	active,
	onPress,
	children,
	vertical,
	...props
}: {
	label: string
	icon?: React.ReactNode
	active?: boolean
	onPress?: () => void
	children?: React.ReactNode
	vertical?: boolean
}) => (
	<View
		flexDirection={vertical ? "column" : "row"}
		alignItems={vertical ? "flex-start" : "center"}
		justifyContent="space-between"
		paddingVertical={8}
		gap={8}
		onPress={onPress}
		pressStyle={{ opacity: 0.6 }}
		{...props}
	>
		<XStack
			justifyContent="center"
			gap={5}
		>
			{icon}

			<AppText
				type="small"
				color={active ? "$productColor" : "$textColor"}
			>
				{label}
			</AppText>
		</XStack>

		{children}
	</View>
)
