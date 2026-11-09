import path from "node:path"

import _7z from "7zip-min"

/**
 * Extracts a compressed archive into the given directory.
 */
export default async function extractCompressedFile(
	from: string,
	to: string,
): Promise<void> {
	const destinationPath = path.resolve(to)

	console.log(`Extracting file [${from}] > [${destinationPath}]`)

	await _7z.unpack(from, destinationPath)
}
