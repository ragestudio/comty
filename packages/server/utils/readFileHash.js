import fs from "node:fs"
import crypto from "crypto"

export default async (stream) => {
	if (typeof stream === "string") {
		stream = fs.createReadStream(stream)
	}

	const hash = crypto.createHash("sha256")

	for await (const chunk of stream) {
		hash.update(chunk)
	}

	return hash.digest("hex")
}
