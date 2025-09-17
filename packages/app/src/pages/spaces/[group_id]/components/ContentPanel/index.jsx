import React from "react"

import GroupPageContext from "../../context"
import ContentPanelContext, { useContentPanelHeaderState } from "./context"

import ChatTab from "../../tabs/chat"
import SettingsTab from "../../tabs/settings"

import "./index.less"

const Tabs = {
	chat: {
		title: "Chat",
		component: ChatTab,
	},
	settings: {
		title: "Settings",
		component: SettingsTab,
	},
}

const ContentPanelHeader = () => {
	const ctx = React.useContext(ContentPanelContext)

	return (
		<div className="group-page__content-panel__header">
			{/* <button onClick={() => ctx.setSelectedContentTab(null)}>
				<FiChevronLeft />
			</button>*/}

			<p>{Tabs[ctx.type]?.title ?? ctx.type}</p>

			{ctx.headerContent && (
				<div className="group-page__content-panel__header__content">
					{ctx.headerContent()}
				</div>
			)}
		</div>
	)
}

const ContentPanelRender = () => {
	const ctx = React.useContext(ContentPanelContext)

	if (!ctx.type) {
		return null
	}

	if (!Tabs[ctx.type] || !Tabs[ctx.type].component) {
		return null
	}

	return React.createElement(Tabs[ctx.type].component, ctx.props)
}

const ContentPanel = () => {
	const ctx = React.useContext(GroupPageContext)

	const { type, props } = ctx.selectedContentTab ?? {}
	const { headerContent, registerHeaderContent, unregisterHeaderContent } =
		useContentPanelHeaderState()

	return (
		<ContentPanelContext.Provider
			value={{
				type: type,
				props: props,
				setSelectedContentTab: ctx.setSelectedContentTab,
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
