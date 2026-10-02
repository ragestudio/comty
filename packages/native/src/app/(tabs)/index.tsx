import React from "react"
import { Image } from "react-native"
import {
	Column as NativeColumn,
	Button as NativeButtom,
	Text as NativeText,
} from "@expo/ui"
import { XStack, YStack } from "tamagui"
import Button from "@/ui/Button"
import Text from "@/ui/Text"

import useApp from "@/engine/app"
import useMainSheetStore from "@/stores/MainSheet"
import { useGroupsList } from "@/lib/spaces"
import GroupsListItem from "@/components/GroupsListItem"
import { Group } from "@comty/shared/types/spaces/group"

const TestSheet = () => {
	return (
		<NativeColumn spacing={12}>
			<NativeText textStyle={{ fontSize: 18, fontWeight: "700" }}>
				Sheet contents
			</NativeText>
			<NativeText>Drag down or tap the overlay to dismiss.</NativeText>
		</NativeColumn>
	)
}

export default function HomeScreen() {
	const app = useApp()
	const sheet = useMainSheetStore()

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
		<YStack
			gap="$5"
			flex={1}
			justifyContent="center"
			alignItems="center"
			paddingHorizontal="$5"
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
				<Button
					type="primary"
					onPress={() => sheet.open("test", <TestSheet />)}
				>
					Other button
				</Button>
			</XStack>
		</YStack>
	)
}
