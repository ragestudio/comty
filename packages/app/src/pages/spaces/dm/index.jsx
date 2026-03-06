import React from "react"
import DMRoomsList from "@components/Spaces/DMRoomsList"
import DMRoom from "@components/Spaces/DMRoom"
import ToolsBar from "@layouts/components/toolsBar"
import SpacesPageContext from "@contexts/WithSpaces/page"

import "@pages/spaces/index.less"

const DirectMessageMainPage = () => {
	const ctx = React.useContext(SpacesPageContext)

	return (
		<>
			{ctx.room && <DMRoom to_user_id={ctx.room} />}

			{!ctx.room && (
				<DMRoomsList
					selectedRoom={ctx.room}
					onClickItem={(room) => {
						ctx.setType("dm")
						ctx.setRoom(room.to_user_id)
						ctx.setChannel(null)
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
