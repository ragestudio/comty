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

import {
	ContentPanelContext,
	useContentPanelHeaderState,
} from "@contexts/WithSpaces/contentPanel"
import { GroupContext, useGroup } from "@contexts/WithSpaces/group"
import SpacesPageContext from "@contexts/WithSpaces/page"

import "@pages/spaces/index.less"
import "./index.less"

const MembersPanelView = (props) => {
	console.log("MembersPanelView", props)

	return (
		<GroupContext.Provider value={props.group}>
			<MembersPanel />
		</GroupContext.Provider>
	)
}

const GroupPage = (props) => {
	const page = React.useContext(SpacesPageContext)
	const currentPageRef = React.useRef()

	const [documentTitle, setDocumentTitle] = useTitle()
	const [content, setContent] = React.useState({})
	const [activeKey, setActiveKey] = React.useState("channels")

	const { headerContent, registerHeaderContent, unregisterHeaderContent } =
		useContentPanelHeaderState()

	const rtcState = useMediaRTCState()
	const group = useGroup({
		group_id: props.params.group_id,
	})

	const onTopBarItemClick = (key) => {
		if (key === "channels") {
			setActiveKey(key)

			page.setChannel(null)
			page.setIsVoice(false)

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

	// handle group loading
	React.useEffect(() => {
		if (!group.data || !group.channels || group.loading) {
			return undefined
		}

		setDocumentTitle(group.data.name)

		// if no channel is selected, load the first text channel (if any)
		if (!page.channel) {
			const firstTextChannel = group.channels.find(
				(channel) => channel.kind === "chat",
			)

			if (firstTextChannel) {
				page.setChannel(firstTextChannel._id)
			}
		}
	}, [group.data, group.channels, group.loading])

	// Handle channel switching
	React.useEffect(() => {
		if (!group.data || group.loading) {
			return undefined
		}

		// check if is needed
		if (currentPageRef.current) {
			if (
				currentPageRef.current.room === page.room &&
				currentPageRef.current.channel === page.channel
			) {
				return undefined
			}
		}

		// update the ref
		currentPageRef.current = page

		const channelData = group.channels?.find(
			(_channel) => _channel._id == page.channel,
		)

		setContent({
			type: page.isVoice ? "channel" : "chat",
			title: channelData?.name ?? "Chat",
			description: channelData?.description,
			props: { _id: page.channel },
		})

		console.debug(
			`[GROUP](${group.data._id}) Switching to channel -> (${page.channel})`,
			{
				data: group.data,
				channelData,
				page,
			},
		)
	}, [group.data, group.loading, page, props.params.group_id])

	if (group.loading) {
		return <Skeleton />
	}

	return (
		<GroupContext.Provider value={group}>
			<ContentPanelContext.Provider
				value={{
					...content,
					setContent: setContent,
					headerContent: headerContent,
					registerHeaderContent: registerHeaderContent,
					unregisterHeaderContent: unregisterHeaderContent,
				}}
			>
				<div className="spaces-page group-page">
					{activeKey === "channels" && !page.channel && (
						<div className="spaces-page__panel">
							<GroupHeader />
							<ChannelsPanel />
						</div>
					)}

					{page.channel && (
						<div className="group-page__content-panel">
							<ContentPanelHeader />
							<ContentPanelRender />
						</div>
					)}
				</div>
			</ContentPanelContext.Provider>
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
