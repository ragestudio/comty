import React from "react"
import DMRoomsList from "@components/Spaces/DMRoomsList"
import DMRoom from "@components/Spaces/DMRoom"
import ToolsBar from "@components/Spaces/ToolsBar"
import { Result, Splitter } from "antd"
import classNames, { type ClassValue } from "clsx"

import useNavigation from "@/stores/spaces/navigation"

import styles from "./index.module.less"

const MIN_PANELS_WIDTH = {
	left: 70,
	main: 500,
	right: 300,
}

const Panel = ({
	children,
	className,
}: {
	children: any
	className?: ClassValue
}) => {
	return (
		<div className={classNames("bg-accent", styles.panel, className)}>
			{children}
		</div>
	)
}

const LeftPanel = () => {
	const nav = useNavigation()

	return (
		<Panel className={classNames(styles.left_panel)}>
			<DMRoomsList
				compact={false}
				selectedRoom={nav.room}
				onClickItem={(room) => {
					nav.actions.navigate({
						type: "dm",
						room: room.to_user_id,
					})
				}}
			/>
		</Panel>
	)
}

const RightPanel = () => {
	const nav = useNavigation()

	return (
		<Panel className={classNames(styles.right_panel)}>
			<ToolsBar />
		</Panel>
	)
}

const MainPanel = () => {
	const nav = useNavigation()

	return <>{nav.room && <DMRoom to_user_id={nav.room} />}</>
}

const SpacesMainPage = () => {
	return (
		<Splitter className={styles.container}>
			<Splitter.Panel
				collapsible={false}
				min={MIN_PANELS_WIDTH.left}
			>
				<LeftPanel />
			</Splitter.Panel>

			<Splitter.Panel
				collapsible={false}
				min={MIN_PANELS_WIDTH.main}
			>
				<MainPanel />
			</Splitter.Panel>

			<Splitter.Panel
				collapsible
				min={MIN_PANELS_WIDTH.right}
			>
				<RightPanel />
			</Splitter.Panel>
		</Splitter>
	)
}

SpacesMainPage.options = {
	layout: {
		type: "default",
		centeredContent: false,
		maxHeight: true,
	},
}

export default SpacesMainPage
