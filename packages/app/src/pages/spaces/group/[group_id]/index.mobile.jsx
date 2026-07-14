import React from "react"
import Icons from "@components/Icons"

import Skeleton from "@components/Skeleton"

import NavMenu from "@components/PagePanels/components/NavMenu"
import ChannelsPanel from "@components/Spaces/Group/ChannelsPanel"
import {
	ContentPanelHeader,
	ContentPanelRender,
} from "@components/Spaces/Group/ContentPanel"
import GroupHeader from "@components/Spaces/Group/GroupHeader"
import MembersPanel from "@components/Spaces/Group/MembersPanel"

import useMediaRTCState from "@hooks/useMediaRTCState"
import useTitle from "@hooks/useTitle"

import { useSpacesNavigation } from "@contexts/WithSpaces/navigation"
import { GroupContext, useGroup } from "@contexts/WithSpaces/group"

import "@pages/spaces/index.less"
import "./index.less"

const MembersPanelView = (props) => {
	return (
		<GroupContext.Provider value={props.group}>
			<MembersPanel />
		</GroupContext.Provider>
	)
}

const GroupPage = (props) => {
	const spaces = useSpacesNavigation()

	const [documentTitle, setDocumentTitle] = useTitle()
	const [activeKey, setActiveKey] = React.useState("channels")

	const rtcState = useMediaRTCState()
	const group = useGroup({
		group_id: props.params.group_id,
	})

	const onTopBarItemClick = (key) => {
		if (key === "channels") {
			setActiveKey(key)

			spaces.navigate({ channel: null, subview: null })

			return
		}

		if (key === "members") {
			app.layout.draggable.open("group-members", MembersPanelView, {
				componentProps: {
					group: group,
				},
			})
			return
		}

		if (key === "settings") {
			spaces.navigate({ channel: null, subview: "settings" })

			return
		}

		setActiveKey(key)
	}

	app.layout.top_bar.render(
		<NavMenu
			onClickItem={onTopBarItemClick}
			items={[
				{ key: "channels", icon: <Icons.Rows3 /> },
				{ key: "members", icon: <Icons.Users /> },
				{ key: "settings", icon: <Icons.Settings /> },
			]}
		/>,
	)

	// set document title when group loads
	React.useEffect(() => {
		if (!group.data || !group.channels || group.loading) {
			return undefined
		}

		setDocumentTitle(group.data.name)
	}, [group.data, group.channels, group.loading])

	if (group.loading) {
		return <Skeleton />
	}

	return (
		<GroupContext.Provider value={group}>
			<div className="spaces-page group-page">
				{activeKey === "channels" &&
					!spaces.channel &&
					!spaces.subview && (
						<div className="spaces-page__panel">
							<GroupHeader />
							<ChannelsPanel />
						</div>
					)}

				{(spaces.channel || spaces.subview) && (
					<div className="group-page__content-panel">
						<ContentPanelHeader />
						<ContentPanelRender />
					</div>
				)}
			</div>
		</GroupContext.Provider>
	)
}

GroupPage.options = {
	layout: {
		type: "spaces",
		centeredContent: false,
		maxHeight: true,
	},
}

export default GroupPage
