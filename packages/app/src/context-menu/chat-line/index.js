import copyToClipboard from "@utils/copyToClipboard"

export default {
	"chat-line": (items, parent, element, control) => {
		parent = parent.closest("[data-message-id]")

		const messageId = parent.getAttribute("data-message-id")
		const messageUserId = parent.getAttribute("data-message-user-id")

		if (!messageId) {
			return items
		}

		items.push({
			label: "Copy ID",
			icon: "FiCopy",
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
				icon: "FiCopy",
				action: (clickedItem, ctx) => {
					copyToClipboard(messageContentText)
					ctx.close()
				},
			})
		}

		// check if can copy user id
		if (messageUserId) {
			// push copy id
			items.push({
				label: "Copy user ID",
				icon: "FiCopy",
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
					icon: "FiEdit",
				})

				items.push({
					label: "Delete message",
					icon: "FiTrash2",
					danger: true,
				})
			}
		}

		return items
	},
}
