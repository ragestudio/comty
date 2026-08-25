import ChatActionsBase from "../base"

import newMessage from "./newMessage"
import messageDeleted from "./messageDeleted"
import messageUpdated from "./messageUpdated"
import typingEvent from "./typingEvent"

class EventsActions extends ChatActionsBase {
	handleNewMessage: OmitThisParameter<typeof newMessage> =
		newMessage.bind(this)
	handleMessageDeleted: OmitThisParameter<typeof messageDeleted> =
		messageDeleted.bind(this)
	handleMessageUpdated: OmitThisParameter<typeof messageUpdated> =
		messageUpdated.bind(this)
	handleTypingEvent: OmitThisParameter<typeof typingEvent> =
		typingEvent.bind(this)
}

export default EventsActions
