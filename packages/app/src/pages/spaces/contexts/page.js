import React from "react"

export const DEFAULT_DATA = {
	type: null,
	room: null,
	channel: null,
	setType: () => null,
	setRoom: () => null,
	setChannel: () => null,
}

export const SpacesPageContext = React.createContext(DEFAULT_DATA)

export default SpacesPageContext
