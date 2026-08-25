import type MessagingActions from "./index"

export default function (this: MessagingActions, messageId: string): void {
	const { type, params } = this.getState()
	if (!type || !params) return

	if (!this.socket) return

	const eventName = type === "group" ? "channel:ack" : "dm:ack"
	const payload = {
		reference_id: type === "group" ? params.channel_id : params.to_user_id,
		message_id: messageId,
	}

	this.socket.emit(eventName, payload)
}
