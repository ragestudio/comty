import type { GroupStoreType } from "../../../stores/group/types"
import ActionsBase from "../../base"

import fetchGroup from "./group"
import fetchChannels from "./channels"
import fetchMembers from "./members"

class FetchingActions extends ActionsBase<GroupStoreType> {
	fetchGroup: OmitThisParameter<typeof fetchGroup> = fetchGroup.bind(this)
	fetchChannels: OmitThisParameter<typeof fetchChannels> =
		fetchChannels.bind(this)
	fetchMembers: OmitThisParameter<typeof fetchMembers> =
		fetchMembers.bind(this)
}

export default FetchingActions
