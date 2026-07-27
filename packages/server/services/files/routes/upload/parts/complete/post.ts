import type { API } from "@services/files/files.service"

export default defineRoute<API>()({
	useContexts: ["multipartUpload"] as const,
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		const { file_hash, upload_id, object_path, parts } = req.body as {
			file_hash: string
			upload_id: string
			object_path: string
			parts: Array<{ PartNumber: number; ETag: string }>
		}

		return await ctx.multipartUpload.complete({
			// @ts-ignore
			user_id: req.auth.session.user_id,
			file_hash,
			upload_id,
			object_path,
			parts,
		})
	},
})
