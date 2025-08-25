import copyToClipboard from "@utils/copyToClipboard"
import pasteFromClipboard from "@utils/pasteFromClipboard"

export default {
	"default-context": (items) => {
		const text = window.getSelection().toString()

		if (text) {
			items.push({
				label: "Copy",
				icon: "FiCopy",
				action: (clickedItem, ctx) => {
					copyToClipboard(text)

					ctx.close()
				},
			})
		}

		items.push({
			label: "Paste",
			icon: "FiClipboard",
			action: (clickedItem, ctx) => {
				pasteFromClipboard(clickedItem)
				ctx.close()
			},
		})

		items.push({
			label: "Report a bug",
			icon: "FiAlertTriangle",
			action: (clickedItem, ctx) => {
				app.eventBus.emit("app.reportBug", {
					clickedItem,
				})

				ctx.close()
			},
		})

		return items
	},
}
