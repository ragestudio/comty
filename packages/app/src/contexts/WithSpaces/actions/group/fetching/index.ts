import GroupActionsBase from "../base"

import fetchGroup from "./group"
import fetchChannels from "./channels"
import fetchMembers from "./members"

class FetchingActions extends GroupActionsBase {
	fetchGroup: OmitThisParameter<typeof fetchGroup> = fetchGroup.bind(this)
	fetchChannels: OmitThisParameter<typeof fetchChannels> =
		fetchChannels.bind(this)
	fetchMembers: OmitThisParameter<typeof fetchMembers> =
		fetchMembers.bind(this)
}

export default FetchingActions
