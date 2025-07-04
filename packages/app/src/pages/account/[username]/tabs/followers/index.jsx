import React from "react"

import FollowersList from "@components/FollowersList"

const FollowersTab = React.memo((props) => {
	return <FollowersList user_id={props.state.user._id} />
})

FollowersTab.displayName = "FollowersTab"

export default FollowersTab
