// Original fork from https://github.com/sindresorhus/read-chunk
import { open } from "node:fs/promises"

export default async (filePath, { length, startPosition }) => {
	const fileDescriptor = await open(filePath, "r")

	try {
		let { bytesRead, buffer } = await fileDescriptor.read({
			buffer: new Uint8Array(length),
			length,
			position: startPosition,
		})

		if (bytesRead < length) {
			buffer = buffer.subarray(0, bytesRead)
		}

		return buffer
	} finally {
		await fileDescriptor?.close()
	}
}
