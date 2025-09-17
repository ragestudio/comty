import copyToClipboard from "@utils/copyToClipboard"
import pasteFromClipboard from "@utils/pasteFromClipboard"
import download from "@utils/download"

export default {
	"default-context": (items, parent, element, control) => {
		// check if element is "a"
		if (element.tagName === "A") {
			items.push({
				label: "Copy Link",
				icon: "Copy",
				action: (clickedItem, ctx) => {
					copyToClipboard(element.href)
					ctx.close()
				},
			})

			items.push({
				label: "Open link",
				icon: "SquareArrowOutUpRight",
				action: (clickedItem, ctx) => {
					window.open(element.href, "_blank")
					ctx.close()
				},
			})

			items.push({
				type: "separator",
			})
		}

		if (
			element.tagName === "IMG" ||
			element.tagName === "VIDEO" ||
			element.tagName === "AUDIO" ||
			element.tagName === "SOURCE"
		) {
			items.push({
				label: "Copy media URL",
				icon: "Copy",
				action: (clickedItem, ctx) => {
					copyToClipboard(element.src)
					ctx.close()
				},
			})

			items.push({
				label: "Open media in new tab",
				icon: "SquareArrowOutUpRight",
				action: (clickedItem, ctx) => {
					window.open(element.src, "_blank")
					ctx.close()
				},
			})

			items.push({
				label: "Download media",
				icon: "Download",
				action: (clickedItem, ctx) => {
					download(element.src)
					ctx.close()
				},
			})

			items.push({
				type: "separator",
			})
		}

		const text = window.getSelection().toString()

		if (text) {
			items.push({
				label: "Copy",
				icon: "Copy",
				action: (clickedItem, ctx) => {
					copyToClipboard(text)

					ctx.close()
				},
			})
		}

		items.push({
			label: "Paste",
			icon: "ClipboardPaste",
			action: (clickedItem, ctx) => {
				pasteFromClipboard(clickedItem)
				ctx.close()
			},
		})

		items.push({
			label: "Report a bug",
			icon: "TriangleAlert",
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
