import React from "react"
import Icons from "@components/Icons"

import Chat from "@components/Spaces/Chat"
import VoiceChannel from "@components/Spaces/VoiceChannel"
import SettingsPanel from "@components/Spaces/Group/SettingsPanel"

import ContentPanelContext from "@contexts/WithSpaces/contentPanel"
import GroupContext from "@contexts/WithSpaces/group"

import "./index.less"

const Tabs = {
	chat: {
		title: "Chat",
		component: Chat,
	},
	settings: {
		title: "Settings",
		component: SettingsPanel,
	},
	channel: {
		title: "Channel",
		component: VoiceChannel,
	},
}

export const ContentPanelHeader = () => {
	const content = React.useContext(ContentPanelContext)

	if (content.type === "chat") {
		return (
			<div className="group-page__content-panel__header">
				<p>
					<Icons.Hash />
					{content.title ?? Tabs[content.type]?.title}
				</p>

				{content.description && (
					<>
						<div className="divider" />
						<span>{content.description}</span>
					</>
				)}

				{content.headerContent && (
					<div className="group-page__content-panel__header__content">
						{content.headerContent()}
					</div>
				)}
			</div>
		)
	}

	if (content.type === "channel") {
		return (
			<div className="group-page__content-panel__header">
				<p>
					<Icons.Volume2 />
					{content.title ?? Tabs[content.type]?.title}
				</p>

				{content.description && (
					<>
						<div className="divider" />
						<span>{content.description}</span>
					</>
				)}

				{content.headerContent && (
					<div className="group-page__content-panel__header__content">
						{content.headerContent()}
					</div>
				)}
			</div>
		)
	}

	return (
		<div className="group-page__content-panel__header">
			{Tabs[content.type]?.title}

			{content.headerContent && (
				<div className="group-page__content-panel__header__content">
					{content.headerContent()}
				</div>
			)}
		</div>
	)
}

export const ContentPanelRender = () => {
	const content = React.useContext(ContentPanelContext)
	const group = React.useContext(GroupContext)

	if (!content.type) {
		return null
	}

	if (!Tabs[content.type] || !Tabs[content.type].component) {
		return (
			<div>
				<p>Not valid</p>
			</div>
		)
	}

	return React.createElement(Tabs[content.type].component, {
		...content.props,
		group: group.data,
	})
}
