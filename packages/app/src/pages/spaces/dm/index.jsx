import React from "react"
import DMRoomsList from "@components/Spaces/DMRoomsList"
import DMRoom from "@components/Spaces/DMRoom"
import ToolsBar from "@layouts/components/toolsBar"

import { useNavigation } from "@comty/spaces-lib"

import "@pages/spaces/index.less"

const DirectMessageMainPage = () => {
	const spaces = useNavigation()

	return (
		<>
			{spaces.room && <DMRoom to_user_id={spaces.room} />}

			{!spaces.room && (
				<DMRoomsList
					selectedRoom={spaces.room}
					onClickItem={(room) => {
						spaces.navigate({
							type: "dm",
							room: room.to_user_id,
						})
					}}
				/>
			)}

			<ToolsBar />
		</>
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
