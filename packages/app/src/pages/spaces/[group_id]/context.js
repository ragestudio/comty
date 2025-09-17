import React from "react"

const DEFAULT_DATA = {
	_id: null,
	name: null,
	description: null,
	cover: null,
	owner_user_id: null,
	groupCoverImageAverageColor: null,
	channels: [],
	connected_members: [],
}

const VALID_CHANNEL_KINDS = ["chat", "voice"]

const GroupContext = React.createContext(DEFAULT_DATA)

export { VALID_CHANNEL_KINDS, DEFAULT_DATA, GroupContext }
export default GroupContext
