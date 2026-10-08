import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import type { LayoutChangeEvent } from "react-native"

import { useEffect, useState } from "react"
import { Tabs } from "expo-router"
import { Image, View } from "react-native"
import { useTheme, XStack, YStack } from "tamagui"
import { Home, RadioIcon } from "lucide-react-native"
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated"
import AppTabBar from "@/components/TabBar"
import RTCControls from "@/components/RTCControls"

import useApp from "@/engine/app"
import useRTCStore from "@comty/spaces-sdk/rtc"

import useRTCControls from "@/components/RTCControls/store"
import { CONTAINER_ANIM_SPRING as RTC_CONTAINER_ANIM_SPRING } from "@/components/RTCControls/constants"

function AnimatedTabBar(props: BottomTabBarProps) {
	const controls = useRTCControls()
	const progress = useSharedValue(controls.expanded ? 1 : 0)
	const pillHeight = useSharedValue(0)
	const [measured, setMeasured] = useState(false)

	useEffect(() => {
		progress.value = withSpring(
			controls.expanded ? 1 : 0,
			RTC_CONTAINER_ANIM_SPRING,
		)
	}, [controls.expanded])

	const style = useAnimatedStyle(() => ({
		height: Math.max(pillHeight.value * (1 - progress.value), 0),
		opacity: Math.max(1 - progress.value, 0),
	}))

	const onLayout = (event: LayoutChangeEvent) => {
		if (measured) return

		const height = event.nativeEvent.layout.height

		if (height > 0) {
			pillHeight.value = height
			setMeasured(true)
		}
	}

	return (
		<Animated.View style={[{ overflow: "hidden" }, measured ? style : null]}>
			<View onLayout={onLayout}>
				<AppTabBar {...props} />
			</View>
		</Animated.View>
	)
}

function BottomBar(props: BottomTabBarProps) {
	const rtc = useRTCStore()
	const controls = useRTCControls()

	// collapse the panel when the call ends, otherwise it stays expanded and keeps
	// the tab bar hidden the next time a call starts
	useEffect(() => {
		if (rtc.state === "disconnected") {
			controls.setExpanded(false)
		}
	}, [rtc.state])

	return (
		<YStack gap={5}>
			{rtc.state !== "disconnected" && <RTCControls />}
			<AnimatedTabBar {...props} />
		</YStack>
	)
}

function TabsLayout() {
	const app = useApp()
	const theme = useTheme()
	const rtc = useRTCStore()

	return (
		<Tabs
			// @ts-ignore
			tabBar={(props) => <BottomBar {...props} />}
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,

				tabBarStyle: {
					backgroundColor: theme.background?.val,
					borderTopColor: theme.borderColor?.val || "transparent",
				},
				tabBarActiveTintColor: theme.productColorAccent?.val,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<Home
							color={color}
							size={24}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="group/[group_id]/[channel]"
				options={{
					title: "Channel View",
					href:
						rtc.state !== "disconnected"
							? `/group/${rtc.channel?.group_id}/${rtc.channel?._id}`
							: null,
					tabBarIcon: ({ color }) => (
						<RadioIcon
							color={color}
							size={24}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					href: app.userData ? "/profile" : null,
					tabBarIcon: ({ color }) => {
						return (
							<XStack
								overflow="hidden"
								borderRadius={8}
								borderWidth={1}
								borderColor="$borderColor"
								width={25}
								height={25}
							>
								<Image
									style={{ flex: 1 }}
									source={{
										uri: app.userData?.avatar,
									}}
								/>
							</XStack>
						)
					},
				}}
			/>
			<Tabs.Screen
				name="group/[group_id]/index"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	)
}

export default TabsLayout
