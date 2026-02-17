import React from "react"

import GroupContext from "@pages/spaces/contexts/group"
import ContentPanelContext, {
	useContentPanelHeaderState,
} from "@pages/spaces/contexts/contentPanel"

import Chat from "@pages/spaces/components/Chat"
import SettingsPanel from "../SettingsPanel"

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
}

export const ContentPanelHeader = () => {
	const content = React.useContext(ContentPanelContext)

	return (
		<div className="group-page__content-panel__header">
			<p>{content.title ?? Tabs[content.type]?.title ?? content.type}</p>

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
		return null
	}

	return React.createElement(Tabs[content.type].component, {
		...content.props,
		group: group,
	})
}

export const ContentPanel = ({ content, setContent }) => {
	const { headerContent, registerHeaderContent, unregisterHeaderContent } =
		useContentPanelHeaderState()

	return (
		<ContentPanelContext.Provider
			value={{
				...content,
				setContent: setContent,
				headerContent: headerContent,
				registerHeaderContent: registerHeaderContent,
				unregisterHeaderContent: unregisterHeaderContent,
			}}
		>
			<div className="group-page__content-panel">
				<ContentPanelHeader />
				<ContentPanelRender />
			</div>
		</ContentPanelContext.Provider>
	)
}

export default ContentPanel
