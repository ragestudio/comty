import type { GroupStoreType } from "../../types"
import ActionsBase from "@/classes/BaseActions"

import init from "./init"
import reset from "./reset"

class LifecycleActions extends ActionsBase<GroupStoreType> {
	init: OmitThisParameter<typeof init> = init.bind(this)
	reset: OmitThisParameter<typeof reset> = reset.bind(this)
}

export default LifecycleActions
