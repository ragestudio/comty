import fs from "node:fs"
import sevenzip from "7zip-min"

export default async function compressFiles(origin, output) {
	// check if out file exists
	if (fs.existsSync(output)) {
		fs.unlinkSync(output)
	}

	await new Promise((resolve, reject) => {
		sevenzip.pack(origin, output, (err) => {
			if (err) {
				return reject(err)
			}

			return resolve(output)
		})
	})

	return output
}
