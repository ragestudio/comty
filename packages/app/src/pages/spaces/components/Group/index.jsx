import React from "react"
import { Result } from "antd"
import classnames from "classnames"

import Skeleton from "@components/Skeleton"

import GroupHeader from "./components/GroupHeader"
import MembersPanel from "./components/MembersPanel"
import ChannelsPanel from "./components/ChannelsPanel"
import ContentPanel from "./components/ContentPanel"

import useTitle from "@hooks/useTitle"
import useGroup from "@pages/spaces/hooks/group"

import SpacesPageContext from "@pages/spaces/contexts/page"
import GroupContext from "@pages/spaces/contexts/group"

import "./index.less"

const Group = ({ group_id }) => {
	const [documentTitle, setDocumentTitle] = useTitle()
	const [content, setContent] = React.useState({})
	const { channel, setChannel } = React.useContext(SpacesPageContext)

	const {
		data: group,
		loading,
		error,
	} = useGroup({
		group_id: group_id,
	})

	// handle group loading
	React.useEffect(() => {
		if (group && !loading) {
			// set the page title with the group name
			setDocumentTitle(group.name)

			// if no channel is selected, load the first text channel (if any)
			if (!channel) {
				const firstTextChannel = group.channels.find(
					(channel) => channel.kind === "chat",
				)

				if (firstTextChannel) {
					setChannel(firstTextChannel._id)
				}
			}
		}
	}, [group, loading])

	// Handle channel switching
	React.useEffect(() => {
		if (group && channel && !loading) {
			const channelData = group.channels?.find(
				(_channel) => _channel._id == channel,
			)

			console.debug(
				`[GROUP](${group._id}) Switching to channel -> (${channel})`,
				{
					group,
					channelData,
				},
			)

			setContent({
				type: "chat",
				title: channelData?.name ?? "Chat",
				props: { _id: channel },
			})
		}
	}, [group, channel, loading])

	if (error) {
		return (
			<Result
				status="error"
				title="Error"
				subTitle="Failed to load group"
			/>
		)
	}

	if (loading) {
		return <Skeleton />
	}

	return (
		<GroupContext.Provider value={group}>
			<div
				className={classnames("group-page")}
				id={group_id}
				data-group-id={group_id}
			>
				<div className="group-page__panels">
					<div className="group-page__panels__panel">
						<GroupHeader setContent={setContent} />
						<ChannelsPanel setContent={setContent} />
					</div>

					<ContentPanel
						content={content}
						setContent={setContent}
					/>

					<div className="group-page__panels__panel">
						<MembersPanel setContent={setContent} />
					</div>
				</div>
			</div>
		</GroupContext.Provider>
	)
}

Group.options = {
	layout: {
		centeredContent: false,
		maxHeight: true,
	},
}

export default Group
