import path from "node:path"
import fs from "node:fs"

import Upload from "@shared-classes/Upload"

export default {
	useContexts: ["cache"],
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		const workPath = path.resolve(
			ctx.cache.constructor.cachePath,
			`${req.auth.session.user_id}-${nanoid()}`,
		)

		await fs.promises.mkdir(workPath, { recursive: true })

		let localFilepath = null

		await req.multipart(async (field) => {
			if (!field.file) {
				throw new OperationError(400, "Missing file")
			}

			localFilepath = path.join(workPath, "file")

			await field.write(localFilepath)
		})

		let transformations = req.headers["transformations"]

		if (transformations) {
			transformations = transformations.split(",").map((t) => t.trim())
		}

		const result = await Upload.fileHandle({
			user_id: req.auth.session.user_id,
			filePath: localFilepath,
			workPath: workPath,
			transformations: transformations,
		})

		res.header("deprecated", "true")
		res.header(
			"deprecation-replacement",
			"Use the new chunked upload API endpoint",
		)

		return result
	},
}
