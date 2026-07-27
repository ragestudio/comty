import type { FilesCore } from "../files.core"

import { UploadMethodHandlers } from "./upload"

export default function (
	this: FilesCore,
	{
		multiple = false,
		accept,
		handlers,
		headers,
	}: {
		multiple?: boolean
		accept?: string
		handlers?: UploadMethodHandlers
		headers?: Record<string, string>
	} = {},
) {
	return new Promise((resolve) => {
		const inputElement = document.createElement("input")
		inputElement.type = "file"
		inputElement.multiple = multiple
		inputElement.accept = accept ?? ""

		inputElement.onchange = (e) => {
			//@ts-ignore
			const files = e.target.files as FileList

			resolve(this.upload(Array.from(files), handlers, headers))
		}

		inputElement.click()
	})
}
