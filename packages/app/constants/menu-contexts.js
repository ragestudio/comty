import download from "utils/download"
import { copyToClipboard } from "utils"

export default {
    "ignore": () => {
        return false
    },
    "postCard-context": (parent, element, control) => {
        const items = [
            {
                label: "Copy ID",
                icon: "Copy",
                action: () => {
                    copyToClipboard(parent.id)
                    control.close()
                }
            },
            {
                label: "Copy Link",
                icon: "Link",
                action: () => {
                    copyToClipboard(`${window.location.origin}/post/${parent.id}`)
                    control.close()
                }
            }
        ]

        let media = null

        // if element div has `addition` class, search inside it for video or image
        if (element.classList.contains("addition")) {
            media = element.querySelector("video, img")
        }

        // if element div has `plyr__poster` class, search outside it for video or image
        if (element.classList.contains("plyr__poster")) {
            console.log(element.parentElement)
            media = element.parentElement.querySelector("video")
        }

        // if media is found, and is a video, search for the source
        if (media && media.tagName === "VIDEO") {
            media = media.querySelector("source")
        }

        if (media) {
            items.push({
                type: "separator"
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
                    app.message.info("Downloading media...")
                    download(media.src)
                    control.close()
                }
            })
        }

        // check if parent has `self-post` attribute
        const isSelf = parent.getAttribute("self-post").toBoolean()

        if (isSelf) {
            items.push({
                type: "separator"
            })

            items.push({
                label: "Delete",
                icon: "Trash",
                action: () => {
                    app.eventBus.emit(`post.${parent.id}.delete`)
                    control.close()
                }
            })

            items.push({
                label: "Edit",
                icon: "Edit2",
                action: () => {
                    app.eventBus.emit(`post.${parent.id}.edit`)
                    control.close()
                }
            })
        }

        return items
    }
}