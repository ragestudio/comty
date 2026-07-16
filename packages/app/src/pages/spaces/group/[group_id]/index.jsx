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

import { useSpacesNavigation } from "@contexts/WithSpaces/navigation"
import { GroupContext, useGroup } from "@contexts/WithSpaces/group"

import useRtcChannelId from "@hooks/useRtcChannelId"
import useTitle from "@hooks/useTitle"

import SplitterSizes from "./splitter_sizes"
import "@pages/spaces/index.less"
import "./index.less"

const GroupPage = (props) => {
	const spaces = useSpacesNavigation()

	const [documentTitle, setDocumentTitle] = useTitle()

	const rtcChannelId = useRtcChannelId()
	const group = useGroup({
		group_id: props.params.group_id,
	})

	const savedSizes = React.useMemo(() => SplitterSizes.loadSizes(), [])

	const handleResizeEnd = React.useCallback((sizes) => {
		SplitterSizes.saveSizes(sizes)
	}, [])

	// set document title when group loads
	React.useEffect(() => {
		if (!group.data || group.loading) {
			return undefined
		}

		setDocumentTitle(group.data.name)

		// if no channel is selected, load the first text channel (if any)
		if (!spaces.channel && !spaces.subview) {
			const firstTextChannel = group.channels.items.find(
				(channel) => channel.kind === "chat",
			)

			if (firstTextChannel) {
				spaces.navigate({ channel: firstTextChannel._id })
			}
		}
	}, [group.data, group.loading])

	return (
		<GroupContext.Provider value={group}>
			<Splitter
				className="group-page"
				onResizeEnd={handleResizeEnd}
			>
				<Splitter.Panel
					className="group-page__panel"
					defaultSize={savedSizes?.[0] ?? 330}
					min={270}
				>
					<GroupHeader />
					<ChannelsPanel />
					{rtcChannelId && <VoiceChannelCard />}
				</Splitter.Panel>

				<Splitter.Panel
					className="group-page__panel"
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
					className="group-page__rightbar"
					defaultSize={savedSizes?.[2] ?? 300}
					min={300}
					collapsible
				>
					<MembersPanel />

					<div className="group-page__rightbar__attached">
						<ToolsBar />
					</div>
				</Splitter.Panel>
			</Splitter>
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
