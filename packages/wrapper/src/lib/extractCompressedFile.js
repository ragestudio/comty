import path from "node:path"
import _7z from "7zip-min"

export default async function extractCompressedFile(from, to) {
	return new Promise((resolve, reject) => {
		console.log(`Extracting file [${from}] > [${to}]`)

		_7z.unpack(path.join(from), path.resolve(to), (err) => {
			if (err) {
				reject(err)
			} else {
				resolve(global.distPath)
			}
		})
	})
}
