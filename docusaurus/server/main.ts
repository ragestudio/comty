import path from "node:path"
import Stream from "node:stream"

import { Server } from "linebridge"
import LiveDirectory from "live-directory"

export class DocsWeb extends Server {
	static baseRoutes = false
	static listenPort = process.env.HTTP_LISTEN_PORT || 5000
	static publicPath = path.resolve(process.cwd(), "public")

	contexts = {
		public: new LiveDirectory(DocsWeb.publicPath, {
			static: true,
		}),
	}

	routes = {
		"/*": defineRoute(DocsWeb)({
			method: "any",
			useContexts: ["public"],
			fn: async (req, res, ctx) => {
				if (!ctx.public) {
					throw new OperationError(404, "Not found")
				}

				let file = ctx.public.get(req.path)

				if (!file) {
					file = ctx.public.get("index.html")
				}

				if (!file) {
					throw new OperationError(404, "file not exist")
				}

				const fileParts = file.path.split(".")
				const extension = fileParts[fileParts.length - 1]

				let content: Buffer<ArrayBufferLike> | Stream.Readable =
					file.content

				if (!content) {
					content = file.stream()
				}

				if (content instanceof Buffer) {
					return res.type(extension).send(content)
				} else {
					return res.type(extension).stream(content)
				}
			},
		}),
	}
}

export default DocsWeb
