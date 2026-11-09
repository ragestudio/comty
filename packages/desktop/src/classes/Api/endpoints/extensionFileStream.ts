import fs from "node:fs"
import path from "node:path"

import mime from "mime"

import type { ApiRoute } from "../types.js"

const route: ApiRoute = {
	path: "/extensions/assets/:namespace/**",
	such: "wildcard",
	method: "get",
	handler: async (req, res, main) => {
		const namespace = req.params.namespace
		const extension = main.extensions.get(namespace)

		// check if the extension is loaded
		if (!extension?.path) {
			res.statusCode = 404
			res.end(JSON.stringify({ error: "Extension not available" }))
			return null
		}

		let filePathRequested = (req.url ?? "").replace(
			`/extensions/assets/${namespace}`,
			"",
		)

		// normalize the path to prevent directory traversal attacks
		filePathRequested = path.normalize(filePathRequested)

		if (filePathRequested.startsWith("/")) {
			filePathRequested = filePathRequested.substring(1)
		}

		const fullPath = path.join(extension.path, filePathRequested)

		const resolvedFullPath = path.resolve(fullPath)
		const resolvedBasePath = path.resolve(extension.path)

		// ensure the requested file is inside the extension directory
		if (
			!resolvedFullPath.startsWith(resolvedBasePath + path.sep) &&
			resolvedFullPath !== resolvedBasePath
		) {
			res.statusCode = 403
			res.end(
				JSON.stringify({
					error: "Access denied: path outside extension directory",
				}),
			)
			return null
		}

		const fileStats = await fs.promises.stat(fullPath)

		if (!fileStats.isFile()) {
			res.statusCode = 404
			res.end(JSON.stringify({ error: "Not found" }))

			return null
		}

		const fileStream = fs.createReadStream(fullPath)

		res.setHeader(
			"Content-Type",
			mime.getType(fullPath) ?? "application/octet-stream",
		)
		res.setHeader("Content-Length", fileStats.size)

		res.writeHead(200)

		fileStream.pipe(res)

		fileStream.on("close", () => {
			res.end()
		})

		fileStream.on("error", (error) => {
			console.error(error)

			res.statusCode = 500
			res.end(JSON.stringify({ error: error.message }))
		})
	},
}

export default route
