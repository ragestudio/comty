import React from "react"
import Icons from "@components/Icons"

import Chat from "@components/Spaces/Chat"
import VoiceChannel from "@components/Spaces/VoiceChannel"
import SettingsPanel from "@components/Spaces/Group/SettingsPanel"

import { useSpacesNavigation, useGroupChannels } from "@comty/spaces-lib"

import "./index.less"

const CONTENT_REGISTRY = {
	chat: {
		icon: Icons.Hash,
		title: "Chat",
		component: Chat,
	},
	channel: {
		icon: Icons.Volume2,
		title: "Channel",
		component: VoiceChannel,
	},
	settings: {
		title: "Settings",
		component: SettingsPanel,
	},
}

const resolveContent = (spaces, channels) => {
	if (spaces.subview === "settings") {
		return {
			type: "settings",
			definition: CONTENT_REGISTRY.settings,
			channelData: null,
		}
	}

	if (!spaces.channel) {
		return { type: null, definition: null, channelData: null }
	}

	const channelData =
		channels?.items?.find((c) => c._id === spaces.channel) ?? null

	const contentType =
		spaces.subview === "voice" || channelData?.kind === "voice"
			? "channel"
			: "chat"

	return {
		type: contentType,
		definition: CONTENT_REGISTRY[contentType],
		channelData,
	}
}

export const ContentPanelHeader = () => {
	const spaces = useSpacesNavigation()
	const channels = useGroupChannels()

	const { definition, channelData } = resolveContent(spaces, channels)

	const title = channelData?.name ?? definition?.title
	const description = channelData?.description
	const Icon = definition?.icon

	return (
		<div className="group-page__content-panel__header">
			<p>
				{Icon && <Icon />}
				{title}
			</p>

			{description && (
				<>
					<div className="divider" />
					<span>{description}</span>
				</>
			)}

			{spaces.headerContent && (
				<div className="group-page__content-panel__header__content">
					{spaces.headerContent()}
				</div>
			)}
		</div>
	)
}

export const ContentPanelRender = () => {
	const spaces = useSpacesNavigation()
	const channels = useGroupChannels()

	const { type, definition } = resolveContent(spaces, channels)

	if (!type || !definition?.component) {
		return null
	}

	return React.createElement(definition.component, {
		_id: spaces.channel,
	})
}
