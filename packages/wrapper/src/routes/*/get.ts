import fs from "node:fs"

import type WebWrapper from "@/main"
import type { WrapperRequest } from "@/types"

export default defineRoute<WebWrapper>()({
	fn: async (req, res) => {
		const file = (req as WrapperRequest<WebWrapper>).file

		if (!file) {
			return res.status(404).json({ error: "File not found" })
		}

		const extension = file.path.split(".").pop() ?? ""

		res.type(extension)

		if (Buffer.isBuffer(file.content)) {
			return res.send(file.content)
		}

		return res.send(await fs.promises.readFile(file.path))
	},
})
