import React from "react"
import { Result, Splitter } from "antd"

import Skeleton from "@components/Skeleton"
import GroupHeader from "@components/Spaces/Group/GroupHeader"
import MembersPanel from "@components/Spaces/Group/MembersPanel"
import ChannelsPanel from "@components/Spaces/Group/ChannelsPanel"
import {
	ContentPanelHeader,
	ContentPanelRender,
} from "@components/Spaces/Group/ContentPanel"
import {
	SettingsMenu,
	SettingsRender,
	useGroupSettingsPage,
} from "@/components/Spaces/Group/SettingsPanel"

import {
	useGroupActions,
	useGroupLoading,
	useGroupError,
	useGroupData,
	useGroupChannels,
} from "@comty/spaces-sdk/group"
import { subscribeGroupSocket } from "@comty/spaces-sdk/events"

import useSpacesNavigation from "@/stores/spaces/navigation"
import useTitle from "@hooks/useTitle"

import { BaseLeftPanel, BaseRightPanel } from "@pages/spaces/layout"
import SplitterSizes from "@pages/spaces/splitter_sizes"
import styles from "@pages/spaces/index.module.less"

const LeftPanel = () => {
	const nav = useSpacesNavigation()
	const settingsPage = useGroupSettingsPage()

	return (
		<BaseLeftPanel>
			<GroupHeader />

			{nav.subview !== "settings" && <ChannelsPanel />}
			{nav.subview === "settings" && (
				<SettingsMenu
					settings={settingsPage.settings}
					selectedKey={settingsPage.selectedKey}
					setSelectedKey={settingsPage.setSelectedKey}
				/>
			)}
		</BaseLeftPanel>
	)
}

const RightPanel = () => {
	return (
		<BaseRightPanel>
			<MembersPanel />
		</BaseRightPanel>
	)
}

const MainPanel = () => {
	const nav = useSpacesNavigation()
	const loading = useGroupLoading()
	const error = useGroupError()
	const settingsPage = useGroupSettingsPage()

	return (
		<>
			{loading && <Skeleton />}
			{error && (
				<Result
					status="error"
					title="Error"
					subTitle={error.message}
				/>
			)}

			{!loading && !error && nav.subview !== "settings" && (
				<div className="group-page__content-panel">
					<ContentPanelHeader />
					<ContentPanelRender />
				</div>
			)}

			{nav.subview === "settings" && (
				<SettingsRender
					settings={settingsPage.settings}
					selectedKey={settingsPage.selectedKey}
				/>
			)}
		</>
	)
}

const GroupPage = (props) => {
	const [documentTitle, setDocumentTitle] = useTitle()

	const nav = useSpacesNavigation()
	const actions = useGroupActions()
	const loading = useGroupLoading()
	const data = useGroupData()
	const channels = useGroupChannels()

	const savedSizes = React.useMemo(() => SplitterSizes.loadSizes(), [])

	const handleResizeEnd = React.useCallback((sizes: number[]) => {
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
			className={styles.container}
			onResizeEnd={handleResizeEnd}
		>
			<Splitter.Panel
				defaultSize={savedSizes?.[0] ?? 330}
				min={270}
			>
				<LeftPanel />
			</Splitter.Panel>

			<Splitter.Panel min={500}>
				<MainPanel />
			</Splitter.Panel>

			<Splitter.Panel
				defaultSize={savedSizes?.[2] ?? 300}
				min={300}
				collapsible
			>
				<RightPanel />
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
