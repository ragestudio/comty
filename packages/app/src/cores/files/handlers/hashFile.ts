import type { FilesCore } from "../files.core"
import type { HashedFile } from "@comty/shared/types/files"

export default async function (
	this: FilesCore,
	files: File[],
): Promise<HashedFile[]> {
	for (const file of files as HashedFile[]) {
		const hasher = this.xxhashInstance.create64(0n)

		const stream = file.stream()
		const reader = stream.getReader()

		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			hasher.update(value)
		}

		file.hash = hasher.digest().toString()
	}

	return files as HashedFile[]
}
