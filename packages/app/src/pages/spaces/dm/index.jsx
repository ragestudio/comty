import React from "react"
import DMRoomsList from "@components/Spaces/DMRoomsList"
import DMRoom from "@components/Spaces/DMRoom"
import ToolsBar from "@components/Spaces/ToolsBar"
import { Result, Splitter } from "antd"

import { useNavigation } from "@comty/spaces-lib"

import "@pages/spaces/index.less"
import "./index.less"

const DirectMessageMainPage = () => {
	const spaces = useNavigation()

	return (
		<Splitter className="dm-page">
			<Splitter.Panel
				className="dm-page__panel"
				min={70}
			>
				<DMRoomsList
					selectedRoom={spaces.room}
					onClickItem={(room) => {
						spaces.navigate({
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
				{spaces.room && <DMRoom to_user_id={spaces.room} />}
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
		type: "spaces",
		centeredContent: false,
		maxHeight: true,
	},
}

export default DirectMessageMainPage
