import React from "react"
import { Result, Splitter } from "antd"

import Skeleton from "@components/Skeleton"
import GroupHeader from "@components/Spaces/Group/GroupHeader"
import MembersPanel from "@components/Spaces/Group/MembersPanel"
import ChannelsPanel from "@components/Spaces/Group/ChannelsPanel"

import ContentPanel from "@components/Spaces/Group/ContentPanel"

import {
	SettingsMenu,
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

import useSpacesNavigation, {
	useSpacesRouteSync,
} from "@/stores/spaces/navigation"
import useTitle from "@hooks/useTitle"

import { BaseLeftPanel, BaseRightPanel } from "@pages/spaces/layout"
import SplitterSizes from "@pages/spaces/splitter_sizes"
import styles from "@pages/spaces/index.module.less"

type SettingsPage = ReturnType<typeof useGroupSettingsPage>

const LeftPanel = ({ settingsPage }: { settingsPage: SettingsPage }) => {
	const nav = useSpacesNavigation()

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

const MainPanel = ({ settingsPage }: { settingsPage: SettingsPage }) => {
	const loading = useGroupLoading()
	const error = useGroupError()

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

			{!loading && !error && <ContentPanel settingsPage={settingsPage} />}
		</>
	)
}

const GroupPage = (props) => {
	const [, setDocumentTitle] = useTitle()

	const nav = useSpacesNavigation()
	const actions = useGroupActions()
	const loading = useGroupLoading()
	const error = useGroupError()
	const data = useGroupData()
	const channels = useGroupChannels()

	const settingsPage = useGroupSettingsPage()

	const groupId = props.params.group_id

	useSpacesRouteSync()

	const savedSizes = React.useMemo(() => SplitterSizes.loadSizes(), [])

	const handleResizeEnd = React.useCallback((sizes: number[]) => {
		SplitterSizes.saveSizes(sizes)
	}, [])

	React.useEffect(() => {
		actions.init(groupId)

		const cleanup = subscribeGroupSocket(groupId)

		return () => {
			cleanup()
			actions.reset()
		}
	}, [groupId])

	// the url is the source of truth, only fallback to the first channel when
	// the current target does not point to a channel of this group
	React.useEffect(() => {
		if (loading || error) return
		if (nav.type !== "group" || nav.room !== groupId) return
		if (nav.subview) return

		const items = channels?.items ?? []

		if (items.length === 0) return
		if (nav.channel && items.some((item) => item._id === nav.channel)) {
			return
		}

		const fallback =
			items.find((channel) => channel.kind === "chat") ?? items[0]

		if (!fallback) return

		nav.actions.navigate({ channel: fallback._id }, { replace: true })
	}, [
		loading,
		error,
		nav.type,
		nav.room,
		nav.subview,
		nav.channel,
		channels?.items,
		groupId,
	])

	React.useEffect(() => {
		if (!data || loading) return

		const channelName = nav.channel
			? channels?.items?.find((channel) => channel._id === nav.channel)?.name
			: null

		if (nav.subview === "settings") {
			setDocumentTitle(`${data.name} · Settings`)
		} else if (channelName) {
			setDocumentTitle(`${data.name} · ${channelName}`)
		} else {
			setDocumentTitle(data.name)
		}
	}, [data, loading, nav.channel, nav.subview, channels?.items])

	return (
		<Splitter
			className={styles.container}
			onResizeEnd={handleResizeEnd}
		>
			<Splitter.Panel
				defaultSize={savedSizes?.[0] ?? 330}
				min={270}
			>
				<LeftPanel settingsPage={settingsPage} />
			</Splitter.Panel>

			<Splitter.Panel min={500}>
				<MainPanel settingsPage={settingsPage} />
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
