import type MessagingActions from "./index"

import { CHAT_CONFIGS } from "../../../stores/chat/constants"
import { ExtendedMessage } from "../../../stores/chat/types"

const getCurrentUserId = (): string | undefined => window.app?.userData?._id

export default async function (
	this: MessagingActions,
	{ message, attachments = [], sticker, reply_to_id }: any = {},
): Promise<boolean | null> {
	const { type, params } = this.getState()

	if (!type || !params) return false
	if (!message && attachments.length === 0 && !sticker) return null

	const config = CHAT_CONFIGS[type]
	const nonce = Math.random().toString(36).substring(7)

	const optimisticMessage: ExtendedMessage = {
		_id: `temp-${nonce}`,
		nonce: nonce,
		channel_id: type === "group" ? params.channel_id : "",
		user_id: getCurrentUserId(),
		message: message,
		attachments: attachments,
		sticker: sticker,
		reply_to_id: reply_to_id,
		status: "sending",
		created_at: new Date() as any, // fallback for dates
	}

	this.state.actions.pushToTimeline([optimisticMessage], "bottom")
	this.state.actions.typing(false)

	const formattedAttachments = attachments.map((att: any) =>
		typeof att === "string"
			? { url: att }
			: { url: att.url, hash: att.hash },
	)

	const data = config.params.send(params, {
		message,
		attachments: formattedAttachments,
		sticker,
		nonce,
		reply_to_id,
	})

	try {
		if (this.socket) {
			await this.socket.call(config.methods.send, data)
		}
	} catch (err) {
		console.error("failed to send message", err)

		this.setState((state) => ({
			timeline: state.timeline.map((msg) =>
				msg.nonce === nonce ? { ...msg, status: "error" } : msg,
			),
		}))
	}

	return true
}
