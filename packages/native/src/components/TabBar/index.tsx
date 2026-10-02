import { TouchableOpacity } from "react-native"
import { XStack, YStack, Text, useTheme } from "tamagui"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import TextureBg from "@/ui/TextureBg"

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
	const theme = useTheme()
	const insets = useSafeAreaInsets()

	return (
		<XStack
			paddingBottom={insets.bottom + 10}
			paddingHorizontal={10}
			alignItems="center"
		>
			<XStack
				justifyContent="space-around"
				alignItems="center"

				padding={10}
				paddingVertical={15}
			>
				<TextureBg
					backgroundColor="$bgAccent"
					borderWidth={1}
					borderRadius={18}
				/>
				{state.routes.map((route, index) => {
					const { options } = descriptors[route.key]

					// @ts-ignore
					if (options.href === null) return null

					const label = options.title !== undefined ? options.title : route.name
					const showLabel = options.tabBarLabelVisibilityMode === "labeled"
					const isFocused = state.index === index
					const color = isFocused
						? theme.productColorAccent?.val
						: theme.color?.val

					const onPress = () => {
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						})

						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name, route.params)
						}
					}

					return (
						<TouchableOpacity
							key={route.key}
							accessibilityRole="button"
							accessibilityState={isFocused ? { selected: true } : {}}
							onPress={onPress}
							style={[
								{ flex: 1, alignItems: "center" },
								options.tabBarItemStyle,
							]}
						>
							<YStack
								alignItems="center"
								gap="$1"
							>
								{options.tabBarIcon &&
									options.tabBarIcon({ focused: isFocused, color, size: 24 })}

								{showLabel && (
									<Text
										color={color}
										fontSize={12}
										fontWeight={isFocused ? "bold" : "normal"}
									>
										{label as string}
									</Text>
								)}
							</YStack>
						</TouchableOpacity>
					)
				})}
			</XStack>
		</XStack>
	)
}

export default TabBar
