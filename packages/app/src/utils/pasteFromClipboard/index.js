export async function pasteFromClipboard(element) {
	if (!navigator.clipboard) {
		throw new Error(
			"Clipboard API not available in this browser or context",
		)
	}

	if (!element || !(element instanceof HTMLElement)) {
		console.error("Invalid element provided to pasteFromClipboard")
		return Promise.reject(new Error("Invalid element provided"))
	}

	let data = await navigator.clipboard.read()

	data = data[0]

	data = await data.getType(data.types[0])

	const event = new ClipboardEvent("paste", {
		clipboardData: new DataTransfer(),
	})

	element.focus()
	element.dispatchEvent(event)

	return data
}

export function isClipboardSupported() {
	return !!navigator.clipboard
}

export default pasteFromClipboard
