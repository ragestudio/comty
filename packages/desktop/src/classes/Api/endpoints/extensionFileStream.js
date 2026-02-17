import fs from "node:fs"
import path from "node:path"

import mime from "mime"

export default {
	path: "/extensions/assets/:namespace/**",
	such: "wildcard",
	method: "get",
	handler: async (req, res, main) => {
		const namespace = req.params.namespace
		const extension = main.extensions.get(namespace)

		// check if exists in main.extensions
		if (!extension) {
			res.statusCode = 404
			res.end(JSON.stringify({ error: "Extension not available" }))
			return null
		}

		let filePathRequested = req.url.replace(
			`/extensions/assets/${namespace}`,
			"",
		)

		// Normalize the file path to prevent directory traversal attacks
		filePathRequested = path.normalize(filePathRequested)

		// Remove leading slash if present
		if (filePathRequested.startsWith("/")) {
			filePathRequested = filePathRequested.substring(1)
		}

		// Construct the full file path
		const fullPath = path.join(extension.path, filePathRequested)

		// Resolve both paths to check if the requested file is within the extension's base path
		const resolvedFullPath = path.resolve(fullPath)
		const resolvedBasePath = path.resolve(extension.path)

		// Check if the resolved full path is within the extension's base path
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

		// Check if file exists and is a file (not a directory)
		const fileStats = await fs.promises.stat(fullPath)

		if (!fileStats.isFile()) {
			res.statusCode = 404
			res.end(JSON.stringify({ error: "Not found" }))

			return null
		}

		// Stream the file to the response
		const fileStream = fs.createReadStream(fullPath)

		// set content type and length
		res.setHeader("Content-Type", mime.getType(fullPath))
		res.setHeader("Content-Length", fileStats.size)

		// write the head
		res.writeHead(200)

		// pipe the buffer
		fileStream.pipe(res)

		// close the stream when it ends
		fileStream.on("close", () => {
			res.end()
		})

		// handle stream erros
		fileStream.on("error", (error) => {
			console.error(error)

			res.statusCode = 500
			res.end(JSON.stringify({ error: error.message }))
		})
	},
}
