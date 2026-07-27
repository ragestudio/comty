import type { API } from "@services/files/files.service"

export default defineRoute<API>()({
	useContexts: ["multipartUpload"] as const,
	useMiddlewares: ["withAuthentication"],
	fn: async (req, res, ctx) => {
		// @ts-ignore
		const userId = req.auth.session.user_id
		const fileHashStr = req.headers["uploader-file-hash"]
		const fileNameStr = req.headers["uploader-file-name"]
		const fileChunksStr = req.headers["uploader-file-chunks"]
		const fileMimeStr = req.headers["uploader-file-mime"]
		const fileSizeStr = req.headers["uploader-file-size"]

		return await ctx.multipartUpload.start({
			user_id: userId,
			file_hash: fileHashStr,
			file_name: fileNameStr,
			file_size: parseInt(fileSizeStr),
			mime_type: fileMimeStr,
			total_chunks: parseInt(fileChunksStr),
		})
	},
})
