import type { GroupStoreType } from "../../types"
import ActionsBase from "@/classes/BaseActions"

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
