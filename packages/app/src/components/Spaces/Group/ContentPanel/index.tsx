import type { SettingTab } from "../SettingsPanel"

import { useGroupChannels } from "@comty/spaces-sdk/group"
import { useSpacesNavigation } from "@/stores/spaces/navigation"

import { SettingsRender } from "../SettingsPanel"

import { ContentProvider } from "./context"
import { resolveContentType } from "./registry"
import { ContentPanelHeader } from "./header"
import { ContentPanelRender } from "./render"

import styles from "./index.module.less"

export type ContentPanelProps = {
	settingsPage?: {
		selectedKey: string
		settings: SettingTab[]
	}
}

export const ContentPanel = ({ settingsPage }: ContentPanelProps) => {
	const spaces = useSpacesNavigation()
	const channels = useGroupChannels()

	const currentChannel =
		channels?.items?.find((channel) => channel._id === spaces.channel) ?? null

	const contentType = resolveContentType({
		subview: spaces.subview,
		channelKind: currentChannel?.kind,
		hasTarget: Boolean(currentChannel),
	})

	const renderContent = () => {
		if (contentType === "settings" && settingsPage) {
			return (
				<SettingsRender
					settings={settingsPage.settings}
					selectedKey={settingsPage.selectedKey}
				/>
			)
		}

		if (contentType) {
			return <ContentPanelRender />
		}

		return (
			<div className={styles.content_panel__empty}>
				{spaces.channel ? "Channel not found" : "Select a channel"}
			</div>
		)
	}

	return (
		<ContentProvider
			type={contentType}
			contextData={currentChannel}
		>
			<div className={styles.content_panel}>
				<ContentPanelHeader />
				{renderContent()}
			</div>
		</ContentProvider>
	)
}

export default ContentPanel
