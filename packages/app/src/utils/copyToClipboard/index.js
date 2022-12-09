export default (text) => {
    if (!navigator.clipboard?.writeText) {
        return app.message.error("Clipboard API not supported")
    }

    navigator.clipboard.writeText(text)
    app.message.success("Copied to clipboard")
}