import ChatActionsBase from "../base"

import typing from "./typing"

class TypingActions extends ChatActionsBase {
	typing: OmitThisParameter<typeof typing> = typing.bind(this)
}

export default TypingActions
