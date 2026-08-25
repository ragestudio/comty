import ChatActionsBase from "../base"

import pushToTimeline from "./pushToTimeline"

class SettersActions extends ChatActionsBase {
	pushToTimeline: OmitThisParameter<typeof pushToTimeline> =
		pushToTimeline.bind(this)
}

export default SettersActions
