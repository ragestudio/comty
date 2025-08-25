import copyToClipboard from "@utils/copyToClipboard"
import download from "@utils/download"

export default {
	"post-card": (items, parent, element, control) => {
		if (!parent.id) {
			parent = parent.parentNode
		}

		items.push({
			label: "Copy ID",
			icon: "FiCopy",
			action: () => {
				copyToClipboard(parent.id)
				control.close()
			},
		})

		items.push({
			label: "Copy Link",
			icon: "FiLink",
			action: () => {
				copyToClipboard(`${window.location.origin}/post/${parent.id}`)
				control.close()
			},
		})

		let media = null

		if (parent.querySelector(".attachment")) {
			media = parent.querySelector(".attachment")
			media = media.querySelector("video, img")

			if (media.querySelector("source")) {
				media = media.querySelector("source")
			}
		}

		if (media) {
			items.push({
				type: "separator",
			})

			items.push({
				label: "Copy media URL",
				icon: "FiCopy",
				action: () => {
					copyToClipboard(media.src)
					control.close()
				},
			})

			items.push({
				label: "Open media in new tab",
				icon: "FiExternalLink",
				action: () => {
					window.open(media.src, "_blank")
					control.close()
				},
			})

			items.push({
				label: "Download media",
				icon: "FiDownload",
				action: () => {
					download(media.src)
					control.close()
				},
			})
		}

		return items
	},
}
