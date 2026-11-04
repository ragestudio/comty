import type { ContentKey, ContentDefinition } from "./types"

import Icons from "@components/Icons"

import Chat from "@components/Spaces/Chat"
import VoiceChannel from "@components/Spaces/VoiceChannel"

const EmptyContent = () => null

export const CONTENT_REGISTRY: Record<ContentKey, ContentDefinition> = {
	chat: {
		icon: Icons.Hash,
		title: "Chat",
		component: Chat,
		defaultHeaderVisible: true,
	},
	channel: {
		icon: Icons.Volume2,
		title: "Channel",
		component: VoiceChannel,
		defaultHeaderVisible: false,
	},
	settings: {
		title: "Settings",
		component: EmptyContent,
		defaultHeaderVisible: false,
	},
}

export type ContentCriteria = {
	subview?: string | null
	channelKind?: string | null
	hasTarget?: boolean
}

export const resolveContentType = ({
	subview,
	channelKind,
	hasTarget,
}: ContentCriteria): ContentKey | null => {
	if (subview === "settings") return "settings"
	if (!hasTarget) return null

	if (subview === "voice" || channelKind === "voice") {
		return "channel"
	}

	return "chat"
}
