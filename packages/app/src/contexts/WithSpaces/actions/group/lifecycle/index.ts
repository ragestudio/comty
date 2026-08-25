import GroupActionsBase from "../base"

import init from "./init"
import reset from "./reset"

class LifecycleActions extends GroupActionsBase {
	init: OmitThisParameter<typeof init> = init.bind(this)
	reset: OmitThisParameter<typeof reset> = reset.bind(this)
}

export default LifecycleActions
