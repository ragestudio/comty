import copyToClipboard from "@utils/copyToClipboard"
import ChatsModel from "@models/chats"

export default {
	"chat-line": (items, parent, element, control) => {
		parent = parent.closest("[data-message-id]")

		const messageId = parent.dataset.messageId
		const messageUserId = parent.dataset.messageUserId

		if (!messageId) {
			return items
		}

		items.push({
			label: "Reply",
			icon: "ReplyAll",
			action: () => {
				control.close()

				const channelElement = parent.closest("[data-channel-id]")
				if (!channelElement) return

				const messageTextElement =
					parent.querySelector("#message-content")
				const messageText =
					messageTextElement?.textContent?.trim() || ""

				const userNameElement = parent.querySelector(
					".channel-chat__timeline__line__content__header__username span",
				)
				const userName = userNameElement?.textContent?.trim() || ""

				const event = new CustomEvent("chat:reply", {
					bubbles: true,
					detail: {
						messageId,
						messageUserId,
						messageText,
						userName,
					},
				})

				channelElement.dispatchEvent(event)
			},
		})

		items.push({
			type: "separator",
		})

		items.push({
			label: "Copy ID",
			icon: "Copy",
			action: () => {
				copyToClipboard(messageId)
				control.close()
			},
		})

		// check if can copy message text
		const messageContentElement = parent.querySelector("#message-content")

		if (messageContentElement) {
			const messageContentText = messageContentElement.textContent

			items.push({
				label: "Copy message",
				icon: "Copy",
				action: (clickedItem, ctx) => {
					copyToClipboard(messageContentText)
					ctx.close()
				},
			})
		}

		// check if can copy user id
		if (messageUserId) {
			const channelElement = parent.closest("[data-channel-id]")

			if (!channelElement) {
				return
			}

			const channelId = channelElement.dataset.channelId
			const groupId = channelElement.dataset.groupId
			const channelType = channelElement.dataset.type

			console.log(channelId, groupId, channelType)

			// push copy id
			items.push({
				label: "Copy user ID",
				icon: "Copy",
				action: () => {
					copyToClipboard(messageUserId)
					control.close()
				},
			})

			// check if user id is self
			if (messageUserId === app.userData._id) {
				items.push({
					type: "separator",
				})

				items.push({
					label: "Edit message",
					icon: "SquarePen",
					disabled: true,
				})

				items.push({
					label: "Delete message",
					icon: "Trash",
					danger: true,
					action: async () => {
						control.close()

						switch (channelType) {
							case "direct": {
								await ChatsModel.dm.messages.delete(
									channelId,
									messageId,
								)
								break
							}
							case "group": {
								await ChatsModel.channels.messages.delete(
									groupId,
									channelId,
									messageId,
								)
							}
						}
					},
				})
			}
		}

		return items
	},
}
