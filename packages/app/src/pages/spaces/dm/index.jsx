import React from "react"
import DMRoomsList from "@components/Spaces/DMRoomsList"
import DMRoom from "@components/Spaces/DMRoom"
import ToolsBar from "@components/Spaces/ToolsBar"
import { Result, Splitter } from "antd"

import useNavigation from "@/stores/spaces/navigation"

import "@pages/spaces/index.less"
import "./index.less"

const DirectMessageMainPage = () => {
	const nav = useNavigation()

	return (
		<Splitter className="dm-page">
			<Splitter.Panel
				className="dm-page__panel"
				min={70}
			>
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
			</Splitter.Panel>

			<Splitter.Panel
				className="dm-page__panel"
				min={500}
			>
				{nav.room && <DMRoom to_user_id={nav.room} />}
			</Splitter.Panel>

			<Splitter.Panel
				className="dm-page__panel__rightbar"
				collapsible
				min={300}
			>
				<ToolsBar />
			</Splitter.Panel>
		</Splitter>
	)
}

DirectMessageMainPage.options = {
	layout: {
		type: "default",
		centeredContent: false,
		maxHeight: true,
	},
}

export default DirectMessageMainPage
