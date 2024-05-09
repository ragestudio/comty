import copyToClipboard from "@utils/copyToClipboard"
import download from "@utils/download"

export default {
    "post-card": (items, parent, element, control) => {
        items.push({
            label: "Copy ID",
            icon: "Copy",
            action: () => {
                copyToClipboard(parent.id)
                control.close()
            }
        })

        items.push({
            label: "Copy Link",
            icon: "Link",
            action: () => {
                copyToClipboard(`${window.location.origin}/post/${parent.id}`)
                control.close()
            }
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
                icon: "Copy",
                action: () => {
                    copyToClipboard(media.src)
                    control.close()
                }
            })

            items.push({
                label: "Open media in new tab",
                icon: "ExternalLink",
                action: () => {
                    window.open(media.src, "_blank")
                    control.close()
                }
            })

            items.push({
                label: "Download media",
                icon: "Download",
                action: () => {
                    download(media.src)
                    control.close()
                }
            })
        }

        return items
    }
}