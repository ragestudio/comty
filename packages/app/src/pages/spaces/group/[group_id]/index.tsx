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
	useGroupActions,
	useGroupLoading,
	useGroupError,
	useGroupData,
	useGroupChannels,
} from "@comty/spaces-sdk/group"

import useSpacesNavigation from "@/stores/spaces/navigation"
import { subscribeGroupSocket } from "@comty/spaces-sdk/events"

import useTitle from "@hooks/useTitle"

import SplitterSizes from "./splitter_sizes"

import {
	SettingsMenu,
	SettingsRender,
	useGroupSettingsPage,
} from "@/components/Spaces/Group/SettingsPanel"
import useRTCStore from "@/rtc"

import "./index.less"

const GroupPage = (props) => {
	const [documentTitle, setDocumentTitle] = useTitle()

	const nav = useSpacesNavigation()
	const actions = useGroupActions()
	const loading = useGroupLoading()
	const error = useGroupError()
	const data = useGroupData()
	const channels = useGroupChannels()
	const rtcState = useRTCStore((s) => s.state)

	const savedSizes = React.useMemo(() => SplitterSizes.loadSizes(), [])

	const handleResizeEnd = React.useCallback((sizes: number[]) => {
		SplitterSizes.saveSizes(sizes)
	}, [])

	const settingsPage = useGroupSettingsPage()

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

		// @ts-ignore
		setDocumentTitle(data.name)

		// if no channel is selected, load the first text channel (if any)
		if (!nav.channel && !nav.subview) {
			const firstTextChannel = channels?.items?.find(
				(channel) => channel.kind === "chat",
			)

			if (firstTextChannel) {
				nav.actions.navigate({ channel: firstTextChannel._id })
			}
		}
	}, [data, loading])

	React.useEffect(() => {
		nav.actions.initFromUrl()
		window.addEventListener("popstate", nav.actions.initFromUrl)

		return () => window.removeEventListener("popstate", nav.actions.initFromUrl)
	}, [])

	return (
		<Splitter
			className="group-page"
			onResizeEnd={handleResizeEnd}
		>
			<Splitter.Panel
				className="group-page__panel group-page__leftbar bg-accent"
				defaultSize={savedSizes?.[0] ?? 330}
				min={270}
			>
				<GroupHeader />

				{nav.subview !== "settings" && <ChannelsPanel />}
				{nav.subview === "settings" && (
					<SettingsMenu
						settings={settingsPage.settings}
						selectedKey={settingsPage.selectedKey}
						setSelectedKey={settingsPage.setSelectedKey}
					/>
				)}

				{rtcState !== "disconnected" && (
					<div className="group-page__leftbar__bottom">
						<VoiceChannelCard />
					</div>
				)}
			</Splitter.Panel>

			<Splitter.Panel
				className="group-page__panel group-page__main"
				min={500}
			>
				{loading && <Skeleton />}
				{!loading && !error && nav.subview !== "settings" && (
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

				{nav.subview === "settings" && (
					<SettingsRender
						settings={settingsPage.settings}
						selectedKey={settingsPage.selectedKey}
					/>
				)}
			</Splitter.Panel>

			<Splitter.Panel
				className="group-page__panel group-page__rightbar bg-accent"
				defaultSize={savedSizes?.[2] ?? 300}
				min={300}
				collapsible
			>
				<MembersPanel />

				<div className="group-page__rightbar__attached">
					<ToolsBar filters={["mediartc-channel"]} />
				</div>
			</Splitter.Panel>
		</Splitter>
	)
}

GroupPage.options = {
	layout: {
		type: "default",
		centeredContent: false,
		maxHeight: true,
	},
}

export default GroupPage
