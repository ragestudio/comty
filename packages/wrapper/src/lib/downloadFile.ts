import fs from "node:fs"
import path from "node:path"
import { pipeline } from "node:stream/promises"

import axios from "axios"

/**
 * Streams a remote file into the given local path.
 */
export default async function downloadFile(
	url: string,
	destinationPath: string,
): Promise<void> {
	await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true })
	await fs.promises.rm(destinationPath, { force: true })

	console.log("Downloading file > ", url)

	const response = await axios.get(url, {
		responseType: "stream",
		maxRedirects: 5,
		timeout: 60_000,
	})

	await pipeline(response.data, fs.createWriteStream(destinationPath))
}
