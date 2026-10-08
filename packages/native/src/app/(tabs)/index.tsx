import type { Group } from "@comty/shared/types/spaces/group"

import React from "react"
import { Image, ScrollView } from "react-native"
import { XStack, YStack } from "tamagui"
import Button from "@/ui/Button"
import Text from "@/ui/Text"
import GroupsListItem from "@/components/GroupsListItem"

import useApp from "@/engine/app"
import useGroupsList from "@comty/spaces-sdk/groupsList"

export default function HomeScreen() {
	const app = useApp()
	const groupsList = useGroupsList()

	const onClickGroupItem = (group_id: Group["_id"]) => {
		app.router?.navigate(`/group/${group_id}`)
	}

	React.useEffect(() => {
		if (app.userData) {
			groupsList.actions.fetchGroups()
		}
	}, [app.userData])

	return (
		<ScrollView
			style={{ flex: 1 }}
			contentContainerStyle={{ flexGrow: 1 }}
		>
			<YStack
				gap="$5"
				flexGrow={1}
				justifyContent="center"
				alignItems="center"
				paddingHorizontal="$5"
				paddingVertical="$5"
			>
				<YStack gap="$5">
					{app.userData?.avatar && (
						<Image
							source={{
								uri: app.userData.avatar,
							}}
							width={100}
							height={100}
						/>
					)}
					<Text
						color="$productColor"
						type="heading"
					>
						{!app.userData && "Welcome to Spaces"}
						{app.userData && `Welcome ${app.userData.username}`}
					</Text>
					<Text color="$productColorAccent">Testing Native app</Text>
					<Text type="mono">Mononononononono</Text>
				</YStack>

				<YStack
					gap="$2"
					width="100%"
				>
					{groupsList.groups.map((group) => {
						return (
							<GroupsListItem
								key={group._id}
								group={group}
								onPress={() => onClickGroupItem(group._id)}
							/>
						)
					})}
				</YStack>

				<XStack gap="$2">
					<Button onPress={() => app.router?.navigate("/auth")}>
						Go to Auth
					</Button>
				</XStack>
			</YStack>
		</ScrollView>
	)
}
