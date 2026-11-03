import type { ReactNode } from "react"
import React from "react"

import * as Application from "expo-application"
import * as pkg from "@/../package.json"
import { version as comtyjsVersion } from "comty.js/package.json"
import { version as spacessdkVersion } from "@comty/spaces-sdk"
import { version as webrtcVersion } from "@ragestudio/react-native-webrtc/package.json"
import { version as expoVersion } from "expo/package.json"

import { Image, ScrollView } from "react-native"
import { XStack, YStack } from "tamagui"
import AppText from "@/ui/Text"
import TextureBg from "@/ui/TextureBg"

import { CogIcon, TagIcon } from "lucide-react-native"

// @ts-ignore
import LogoIcon from "@/assets/logo.svg"

export const AboutAppHeader = () => {
	return (
		<XStack
			alignItems="center"
			padding={15}
			gap={10}
		>
			<TextureBg
				borderWidth={1}
				borderRadius={12}
			/>
			<LogoIcon
				width={60}
				height={60}
			/>

			<YStack
				justifyContent="center"
				gap={5}
			>
				<AppText
					fontSize={24}
					fontFamily="$silk"
				>
					{Application.applicationName}
				</AppText>
				<AppText
					fontFamily="$mono"
					fontSize={12}
				>
					{pkg?.author ?? "unlicensed"}© {new Date().getFullYear()}
				</AppText>
				<AppText
					fontFamily="$mono"
					fontSize={12}
				>
					Licensed with {pkg?.license ?? "unlicensed"}{" "}
				</AppText>
			</YStack>
		</XStack>
	)
}

export const FieldKeyValue = ({
	field,
	icon,
	value,
}: {
	field?: string | null
	icon?: ReactNode | null
	value?: string | null
}) => {
	return (
		<XStack
			flex={1}
			paddingVertical={10}
			paddingHorizontal={10}
			justifyContent="space-between"
			alignItems="center"
		>
			<TextureBg
				borderWidth={1}
				borderRadius={12}
			/>

			<XStack
				alignItems="center"
				gap={5}
			>
				{icon}
				<AppText fontWeight={500}>{field}</AppText>
			</XStack>

			<AppText type="mono">{value}</AppText>
		</XStack>
	)
}

export const SettingsPage = () => {
	return (
		<ScrollView>
			<YStack
				flex={1}
				gap={10}
				paddingVertical={10}
				paddingHorizontal={10}
			>
				<AboutAppHeader />

				<YStack gap={5}>
					<FieldKeyValue
						field={"Version"}
						icon={<CogIcon />}
						value={`${Application.nativeApplicationVersion}-${Application.nativeBuildVersion}`}
					/>
					<FieldKeyValue
						field={"ID"}
						icon={<CogIcon />}
						value={`${Application.applicationId}`}
					/>
					<FieldKeyValue
						field={"React"}
						icon={<CogIcon />}
						value={React.version}
					/>
					<FieldKeyValue
						field={"Expo"}
						icon={<CogIcon />}
						value={expoVersion}
					/>
					<FieldKeyValue
						field={"SDK"}
						icon={<CogIcon />}
						value={spacessdkVersion}
					/>
					<FieldKeyValue
						field={"WebRTC"}
						icon={<CogIcon />}
						value={webrtcVersion}
					/>
					<FieldKeyValue
						field={"Comty.JS"}
						icon={<CogIcon />}
						value={comtyjsVersion}
					/>
				</YStack>
			</YStack>
		</ScrollView>
	)
}

export default SettingsPage
