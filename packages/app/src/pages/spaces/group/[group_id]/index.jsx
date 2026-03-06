import React from "react"
import { Result, Splitter } from "antd"

import Skeleton from "@components/Skeleton"
import ToolsBar from "@components/Spaces/ToolsBar"

import VoiceChannelCard from "@components/Spaces/VoiceChannelCard"
import GroupHeader from "@components/Spaces/Group/GroupHeader"
import MembersPanel from "@components/Spaces/Group/MembersPanel"
import ChannelsPanel from "@components/Spaces/Group/ChannelsPanel"
import {
	ContentPanelHeader,
	ContentPanelRender,
} from "@components/Spaces/Group/ContentPanel"

import useTitle from "@hooks/useTitle"
import useMediaRTCState from "@hooks/useMediaRTCState"

import SpacesPageContext from "@contexts/WithSpaces/page"
import { GroupContext, useGroup } from "@contexts/WithSpaces/group"
import {
	useContentPanelHeaderState,
	ContentPanelContext,
} from "@contexts/WithSpaces/contentPanel"

import "@pages/spaces/index.less"
import "./index.less"

const GroupPage = (props) => {
	const page = React.useContext(SpacesPageContext)
	const currentPageRef = React.useRef()

	const [documentTitle, setDocumentTitle] = useTitle()
	const [content, setContent] = React.useState({})

	const { headerContent, registerHeaderContent, unregisterHeaderContent } =
		useContentPanelHeaderState()

	const rtcState = useMediaRTCState()
	const group = useGroup({
		group_id: props.params.group_id,
	})

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
				<Splitter className="spaces-page group-page">
					<Splitter.Panel
						className="spaces-page__panel"
						defaultSize={330}
						min={270}
					>
						<GroupHeader />
						<ChannelsPanel />
						{rtcState?.channelId && <VoiceChannelCard />}
					</Splitter.Panel>

					<Splitter.Panel
						className="spaces-page__content"
						min={500}
					>
						{group.loading && <Skeleton />}
						{!group.loading && !group.error && (
							<div className="group-page__content-panel">
								<ContentPanelHeader />
								<ContentPanelRender />
							</div>
						)}
						{group.error && (
							<Result
								status="error"
								title="Error"
								subTitle={group.error.message}
							/>
						)}
					</Splitter.Panel>

					<Splitter.Panel
						className="spaces-page__rightbar"
						defaultSize={300}
						min={300}
					>
						<MembersPanel />

						<div className="spaces-page__rightbar__attached">
							<ToolsBar />
						</div>
					</Splitter.Panel>
				</Splitter>
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
