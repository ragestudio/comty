import copyToClipboard from "@utils/copyToClipboard"
import download from "@utils/download"

export default {
	"post-card": (items, parent, element, control) => {
		if (!parent.id) {
			parent = parent.parentNode
		}

		items.push({
			label: "Copy ID",
			icon: "Copy",
			action: () => {
				copyToClipboard(parent.id)
				control.close()
			},
		})

		items.push({
			label: "Copy Link",
			icon: "Link2",
			action: () => {
				copyToClipboard(`${window.location.origin}/post/${parent.id}`)
				control.close()
			},
		})

		return items
	},
}
