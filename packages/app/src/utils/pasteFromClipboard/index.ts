export interface ClipboardPayload {
	text: string
	files: File[]
}

const editableSelector =
	"input, textarea, [contenteditable=''], [contenteditable='true']"

function isTextEditable(element: HTMLElement): boolean {
	if (element instanceof HTMLInputElement) {
		return /^(text|search|url|tel|password)$/i.test(element.type)
	}

	return element instanceof HTMLTextAreaElement || element.isContentEditable
}

export function resolvePasteTarget(element: HTMLElement): HTMLElement {
	if (isTextEditable(element)) {
		return element
	}

	const editableParent = element.closest<HTMLElement>(editableSelector)

	if (editableParent) {
		return editableParent
	}

	const activeElement = document.activeElement

	if (activeElement instanceof HTMLElement && isTextEditable(activeElement)) {
		return activeElement
	}

	return element
}

async function readClipboardPayload(): Promise<ClipboardPayload> {
	const files: File[] = []

	if (navigator.clipboard.read) {
		try {
			const items = await navigator.clipboard.read()

			let text = ""

			for (const item of items) {
				if (item.types.includes("text/plain")) {
					const blob = await item.getType("text/plain")
					text = await blob.text()
				}

				for (const type of item.types) {
					if (type.startsWith("text/")) {
						continue
					}

					const blob = await item.getType(type)
					const extension = type.split("/")[1]?.split("+")[0] || "bin"

					files.push(
						new File([blob], `clipboard.${extension}`, {
							type,
						}),
					)
				}
			}

			return { text, files }
		} catch (error) {
			// clipboard.read needs permissions, fallback to plain text
			console.debug(
				"[pasteFromClipboard] could not read clipboard items",
				error,
			)
		}
	}

	if (navigator.clipboard.readText) {
		const text = await navigator.clipboard.readText()

		return { text, files }
	}

	return { text: "", files }
}

function buildDataTransfer(payload: ClipboardPayload) {
	const dataTransfer = new DataTransfer()

	if (payload.text) {
		dataTransfer.setData("text/plain", payload.text)
	}

	for (const file of payload.files) {
		dataTransfer.items.add(file)
	}

	return dataTransfer
}

function dispatchPasteEvent(target: HTMLElement, dataTransfer: DataTransfer) {
	const event = new ClipboardEvent("paste", {
		bubbles: true,
		cancelable: true,
		clipboardData: dataTransfer,
	})

	// some browsers ignore clipboardData in the constructor
	if (!event.clipboardData) {
		Object.defineProperty(event, "clipboardData", {
			value: dataTransfer,
		})
	}

	target.dispatchEvent(event)

	return event
}

function applyInputValue(
	element: HTMLInputElement | HTMLTextAreaElement,
	value: string,
) {
	// use the native setter so react's value tracker notices the change
	const prototype =
		element instanceof HTMLTextAreaElement
			? HTMLTextAreaElement.prototype
			: HTMLInputElement.prototype

	const descriptor = Object.getOwnPropertyDescriptor(prototype, "value")

	descriptor?.set?.call(element, value)

	element.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertText(target: HTMLElement, text: string) {
	if (!text || !isTextEditable(target)) {
		return
	}

	target.focus()

	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement
	) {
		const start = target.selectionStart ?? target.value.length
		const end = target.selectionEnd ?? start
		const value =
			target.value.slice(0, start) + text + target.value.slice(end)

		applyInputValue(target, value)

		const caret = start + text.length
		target.setSelectionRange(caret, caret)

		return
	}

	if (target.isContentEditable) {
		document.execCommand("insertText", false, text)
	}
}

export async function pasteFromClipboard(
	element: HTMLElement,
): Promise<ClipboardPayload> {
	if (!navigator.clipboard) {
		throw new Error(
			"Clipboard API not available in this browser or context",
		)
	}

	if (!(element instanceof HTMLElement)) {
		throw new Error("Invalid element provided")
	}

	const payload = await readClipboardPayload()
	const target = resolvePasteTarget(element)

	target.focus()

	const event = dispatchPasteEvent(target, buildDataTransfer(payload))

	// synthetic paste events do not run the browser default insertion
	if (!event.defaultPrevented) {
		insertText(target, payload.text)
	}

	return payload
}

export function isClipboardSupported() {
	return (
		!!navigator.clipboard &&
		(!!navigator.clipboard.read || !!navigator.clipboard.readText)
	)
}

export default pasteFromClipboard
