import type { Group } from "@comty/shared/types/spaces/group"

import React from "react"
import { ScrollView } from "react-native"
import { XStack, YStack } from "tamagui"
import GroupsListItem from "@/components/GroupsListItem"
import ButtonIcon from "@/ui/ButtonIcon"

import useApp from "@/engine/app"
import useGroupsList from "@comty/spaces-sdk/groupsList"
import useAuth from "comty.js/auth/use"
import AppText from "@/ui/Text"
import TextureBg from "@/ui/TextureBg"
import {
	BuildingComplexPlusIcon,
	MessagesCircleIcon,
} from "lucide-react-native"
import Separator from "@/ui/Separator"

const LeftBar = () => {
	const app = useApp()
	const groupsList = useGroupsList()
	const auth = useAuth()

	const onClickGroupItem = (group_id: Group["_id"]) => {
		app.router?.navigate(`/group/${group_id}`)
	}

	const onClickDMButton = () => {}
	const onClickNewGroupButton = () => {}

	React.useEffect(() => {
		if (auth.user) {
			groupsList.actions.fetchGroups()
		}
	}, [auth.user])

	return (
		<YStack
			flexShrink={0}
			padding={5}
			gap={5}
			width={60}
			height="100%"
			position="relative"
			alignItems="center"
		>
			<TextureBg
				borderWidth={1}
				borderRadius={12}
			/>

			<ScrollView
				style={{ flex: 1, zIndex: 1 }}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ gap: 5 }}
			>
				<ButtonIcon
					icon={<MessagesCircleIcon />}
					width={45}
					height={45}
					onPress={onClickDMButton}
				/>

				<Separator />

				{groupsList.groups.map((group) => {
					return (
						<GroupsListItem
							onlyIcon={true}
							key={group._id}
							group={group}
							onPress={() => onClickGroupItem(group._id)}
						/>
					)
				})}

				<ButtonIcon
					icon={<BuildingComplexPlusIcon />}
					width={45}
					height={45}
					onPress={onClickNewGroupButton}
					backgroundColor="$borderColor"
					borderRadius="100%"
					borderStyle="dashed"
				/>
			</ScrollView>
		</YStack>
	)
}

export default function HomeScreen() {
	return (
		<XStack
			flex={1}
			paddingVertical={10}
			paddingHorizontal={10}
			gap={10}
			alignItems="stretch"
		>
			<LeftBar />

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ flexGrow: 1, gap: 10 }}
			>
				<AppText>Main panel</AppText>
			</ScrollView>
		</XStack>
	)
}
