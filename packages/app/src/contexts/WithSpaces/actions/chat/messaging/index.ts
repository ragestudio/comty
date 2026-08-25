import ChatActionsBase from "../base"

import send from "./send"
import sendReadAck from "./sendReadAck"

class MessagingActions extends ChatActionsBase {
	send: OmitThisParameter<typeof send> = send.bind(this)
	sendReadAck: OmitThisParameter<typeof sendReadAck> = sendReadAck.bind(this)
}

export default MessagingActions
