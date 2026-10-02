import type { GroupStoreType } from "../../../stores/group/types"
import ActionsBase from "../../base"

import setData from "./data"
import setChannels from "./channels"
import setMembers from "./members"
import setConnectedMembers from "./connectedMembers"

class SettersActions extends ActionsBase<GroupStoreType> {
	setData: OmitThisParameter<typeof setData> = setData.bind(this)
	setChannels: OmitThisParameter<typeof setChannels> = setChannels.bind(this)
	setMembers: OmitThisParameter<typeof setMembers> = setMembers.bind(this)
	setConnectedMembers: OmitThisParameter<typeof setConnectedMembers> =
		setConnectedMembers.bind(this)
}

export default SettersActions
