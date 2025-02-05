import fs from "node:fs"
import path from "node:path"

import axios from "axios"

export default async function downloadFile(url, destination, filename) {
	// check if bundle exists
	if (fs.existsSync(path.join(destination, filename))) {
		fs.unlinkSync(path.join(destination, filename))
	}

	console.log("Downloading file > ", url)

	const response = await axios.get(url, {
		responseType: "stream",
	})

	const writer = fs.createWriteStream(path.join(destination, filename))

	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on("finish", resolve)
		writer.on("error", reject)
	})
}
