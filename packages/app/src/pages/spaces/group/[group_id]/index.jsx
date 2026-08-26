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

import {
	useSpacesNavigation,
	useGroupActions,
	useGroupLoading,
	useGroupError,
	useGroupData,
	useGroupChannels,
	subscribeGroupSocket,
} from "@comty/spaces-lib"

import useRtcChannelId from "@hooks/useRtcChannelId"
import useTitle from "@hooks/useTitle"

import SplitterSizes from "./splitter_sizes"

import "@pages/spaces/index.less"
import "./index.less"

const GroupPage = (props) => {
	const spaces = useSpacesNavigation()

	const [documentTitle, setDocumentTitle] = useTitle()

	const rtcChannelId = useRtcChannelId()

	const actions = useGroupActions()
	const loading = useGroupLoading()
	const error = useGroupError()
	const data = useGroupData()
	const channels = useGroupChannels()

	const savedSizes = React.useMemo(() => SplitterSizes.loadSizes(), [])

	const handleResizeEnd = React.useCallback((sizes) => {
		SplitterSizes.saveSizes(sizes)
	}, [])

	React.useEffect(() => {
		actions.init(props.params.group_id)
		const cleanup = subscribeGroupSocket(props.params.group_id)

		return () => {
			cleanup()
			actions.reset()
		}
	}, [props.params.group_id])

	// set document title when group loads
	React.useEffect(() => {
		if (!data || loading) {
			return undefined
		}

		setDocumentTitle(data.name)

		// if no channel is selected, load the first text channel (if any)
		if (!spaces.channel && !spaces.subview) {
			const firstTextChannel = channels?.items?.find(
				(channel) => channel.kind === "chat",
			)

			if (firstTextChannel) {
				spaces.navigate({ channel: firstTextChannel._id })
			}
		}
	}, [data, loading])

	return (
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
				{loading && <Skeleton />}
				{!loading && !error && (
					<div className="group-page__content-panel">
						<ContentPanelHeader />
						<ContentPanelRender />
					</div>
				)}
				{error && (
					<Result
						status="error"
						title="Error"
						subTitle={error.message}
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
