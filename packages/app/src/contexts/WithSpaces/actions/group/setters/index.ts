import GroupActionsBase from "../base"

import setData from "./data"
import setChannels from "./channels"
import setMembers from "./members"
import setConnectedMembers from "./connectedMembers"

class SettersActions extends GroupActionsBase {
	setData: OmitThisParameter<typeof setData> = setData.bind(this)
	setChannels: OmitThisParameter<typeof setChannels> = setChannels.bind(this)
	setMembers: OmitThisParameter<typeof setMembers> = setMembers.bind(this)
	setConnectedMembers: OmitThisParameter<typeof setConnectedMembers> =
		setConnectedMembers.bind(this)
}

export default SettersActions
