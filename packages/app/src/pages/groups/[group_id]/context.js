import React from "react"

const DEFAULT_DATA = {
	_id: null,
	name: null,
	description: null,
	cover: null,
	owner_user_id: null,
	channels: [],
}

const GroupContext = React.createContext(DEFAULT_DATA)

export default GroupContext

export { DEFAULT_DATA, GroupContext }
