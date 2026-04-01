import fs from "node:fs"
import crypto from "crypto"

export default async (file) => {
	if (typeof file === "string") {
		file = fs.createReadStream(file)
	}

	const hash = crypto.createHash("sha256")

	for await (const chunk of stream) {
		hash.update(chunk)
	}

	return hash.digest("hex")
}
