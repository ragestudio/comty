import ChatActionsBase from "../base"

import init from "./init"
import reset from "./reset"
import setPausedUpdates from "./setPausedUpdates"

class LifecycleActions extends ChatActionsBase {
	init: OmitThisParameter<typeof init> = init.bind(this)
	reset: OmitThisParameter<typeof reset> = reset.bind(this)
	setPausedUpdates: OmitThisParameter<typeof setPausedUpdates> =
		setPausedUpdates.bind(this)
}

export default LifecycleActions
