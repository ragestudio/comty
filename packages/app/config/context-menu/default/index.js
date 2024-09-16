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
                }
            })
        }

        items.push({
            label: "Paste",
            icon: "FiClipboard",
            action: (clickedItem, ctx) => {
                app.message.error("This action is not supported by your browser")

                ctx.close()
            }
        })

        items.push({
            label: "Report a bug",
            icon: "FiAlertTriangle",
            action: (clickedItem, ctx) => {
                app.eventBus.emit("app.reportBug", {
                    clickedItem,
                })

                ctx.close()
            }
        })

        return items
    }
}