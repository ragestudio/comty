import { Tabs } from "expo-router"
import { Image } from "react-native"
import { useTheme, View, XStack } from "tamagui"
import { Home, User } from "lucide-react-native"
import AppTabBar from "@/components/TabBar"

import useApp from "@/engine/app"

export default function TabsLayout() {
	const app = useApp()
	const theme = useTheme()

	return (
		<Tabs
			// @ts-ignore
			tabBar={(props) => <AppTabBar {...props} />}
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
				name="profile"
				options={{
					href: app.auth ? "/profile" : null,
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
