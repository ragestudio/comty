import ChatActionsBase from "../base"

import sync from "./sync"

class SyncActions extends ChatActionsBase {
	sync: OmitThisParameter<typeof sync> = sync.bind(this)
}

export default SyncActions
