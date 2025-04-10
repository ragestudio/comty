/**
 * Copies content to clipboard, supporting both text and file data
 * @param {string|File|Blob} content - The content to copy (text string or file/blob data)
 * @param {Object} options - Optional configuration
 * @param {string} options.successMessage - Custom success message
 * @returns {Promise<boolean>} - Promise resolving to success state
 */
export default async (content, options = {}) => {
	const { successMessage = "Copied to clipboard" } = options

	try {
		if (!navigator.clipboard) {
			app.message.error("Clipboard API not supported")
			return false
		}

		if (typeof content === "string") {
			await navigator.clipboard.writeText(content)

			app.message.success(successMessage)

			return true
		}

		if (content instanceof File || content instanceof Blob) {
			const clipboardItem = new ClipboardItem({
				[content.type]: content,
			})

			if (!navigator.clipboard.write) {
				app.message.error("File copying not supported in this browser")
				return false
			}

			await navigator.clipboard.write([clipboardItem])
			app.message.success(successMessage)
			return true
		}

		app.message.error("Unsupported content type")
		return false
	} catch (error) {
		console.error("Clipboard operation failed:", error)
		app.message.error("Failed to copy to clipboard")

		return false
	}
}
