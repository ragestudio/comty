import type { SetChatState, GetChatState } from "./context"

import { CHAT_CONFIGS, getSocket } from "../constants"
import { ExtendedMessage } from "../types"

const getCurrentUserId = (): string | undefined => window.app?.userData?._id

export const createMessaging = (set: SetChatState, get: GetChatState) => ({
	send: async ({
		message,
		attachments = [],
		sticker,
		reply_to_id,
	}: any = {}) => {
		const { type, params } = get()
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
			created_at: new Date(),
		}

		get().actions.pushToTimeline([optimisticMessage], "bottom")
		get().actions.typing(false)

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

		const socket = getSocket()
		try {
			if (socket) {
				await socket.call(config.methods.send, data)
			}
		} catch (err) {
			console.error("failed to send message", err)
			set((state) => ({
				timeline: state.timeline.map((msg) =>
					msg.nonce === nonce ? { ...msg, status: "error" } : msg,
				),
			}))
		}
		return true
	},

	sendReadAck: (messageId: string) => {
		const { type, params } = get()
		if (!type || !params) return

		const socket = getSocket()
		if (!socket) return

		const eventName = type === "group" ? "channel:ack" : "dm:ack"
		const payload = {
			reference_id:
				type === "group" ? params.channel_id : params.to_user_id,
			message_id: messageId,
		}

		socket.emit(eventName, payload)
	},
})
