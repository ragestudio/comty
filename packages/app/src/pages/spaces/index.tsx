import React from "react"
import classNames from "clsx"
import { Splitter } from "antd"

import DMRoomsList from "@components/Spaces/DMRoomsList"
import DMRoom from "@components/Spaces/DMRoom"

import useNavigation from "@/stores/spaces/navigation"

import { BaseLeftPanel } from "@pages/spaces/layout"
import styles from "@pages/spaces/index.module.less"

const MIN_PANELS_WIDTH = {
	left: 300,
	main: 500,
	right: 300,
}

const MAX_PANELS_WIDTH = {
	left: 460,
}

const LeftPanel = () => {
	const nav = useNavigation()

	const onClickDMListItem = (item) => {
		nav.actions.navigate({
			type: "dm",
			room: item.to_user_id,
		})
	}

	return (
		<BaseLeftPanel>
			<div className={classNames(styles.panel_section)}>
				<div className={styles.panel_section__header}>
					<span>Direct Messages</span>
				</div>

				<DMRoomsList
					compact={false}
					selectedRoom={nav.room}
					onClickItem={onClickDMListItem}
				/>
			</div>
		</BaseLeftPanel>
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
				max={MAX_PANELS_WIDTH.left}
				defaultSize={350}
			>
				<LeftPanel />
			</Splitter.Panel>

			<Splitter.Panel
				collapsible={false}
				min={MIN_PANELS_WIDTH.main}
			>
				<MainPanel />
			</Splitter.Panel>

			{/*<Splitter.Panel
				collapsible
				min={MIN_PANELS_WIDTH.right}
			>
				<RightPanel />
			</Splitter.Panel>*/}
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
