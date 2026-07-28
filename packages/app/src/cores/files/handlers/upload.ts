import type { FilesCore } from "../files.core"
import type { HashedFile } from "@comty/shared/types/files"

import { UploadProgress, UploadTask } from "../task/task"

export type UploadMethodHandlers = {
	onFinish: (file: HashedFile, result: any) => void
	onError: (e: Error) => void
	onProgress: (file: HashedFile, progress: UploadProgress) => void
	onFinally: (file: HashedFile, result: any) => void
}

export default async function (
	this: FilesCore,
	files: File[] | File,
	handlers?: UploadMethodHandlers,
	headers?: Record<string, string>,
) {
	if (!Array.isArray(files)) {
		files = [files]
	}

	const finalFiles = await this.hashFile(files)
	const resolvePromises = []

	for (const file of finalFiles) {
		const task = new UploadTask(file, headers)

		if (typeof handlers?.onFinish === "function") {
			task.on("finish", handlers.onFinish)
		}
		if (typeof handlers?.onError === "function") {
			task.on("error", handlers.onError)
		}
		if (typeof handlers?.onProgress === "function") {
			task.on("progress", handlers.onProgress)
		}
		if (typeof handlers?.onFinally === "function") {
			task.on("finally", handlers.onFinally)
		}

		resolvePromises.push(this.tasks.add(task))
	}

	return Promise.all(resolvePromises)
}
