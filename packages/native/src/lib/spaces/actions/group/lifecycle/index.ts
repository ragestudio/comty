import type { GroupStoreType } from "../../../stores/group/types"
import ActionsBase from "../../base"

import init from "./init"
import reset from "./reset"

class LifecycleActions extends ActionsBase<GroupStoreType> {
	init: OmitThisParameter<typeof init> = init.bind(this)
	reset: OmitThisParameter<typeof reset> = reset.bind(this)
}

export default LifecycleActions
