import { Core } from "@ragestudio/vessel"

import ChunkedUpload from "@classes/ChunkedUpload"
import SessionModel from "@models/session"

export default class RemoteStorage extends Core {
	static namespace = "remoteStorage"
	static depends = ["api", "tasksQueue"]

	public = {
		uploadFile: this.uploadFile,
		getFileHash: this.getFileHash,
		binaryArrayToFile: this.binaryArrayToFile,
	}

	binaryArrayToFile(bin, filename) {
		const { format, data } = bin

		const filenameExt = format.split("/")[1]
		filename = `${filename}.${filenameExt}`

		const byteArray = new Uint8Array(data)
		const blob = new Blob([byteArray], { type: data.type })

		return new File([blob], filename, {
			type: format,
		})
	}

	async getFileHash(file) {
		const buffer = await file.arrayBuffer()
		const hash = await crypto.subtle.digest("SHA-256", buffer)
		const hashArray = Array.from(new Uint8Array(hash))
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")

		return hashHex
	}

	async uploadFile(
		file,
		{
			onProgress = () => {},
			onFinish = () => {},
			onError = () => {},
			service = "standard",
			headers = {},
		} = {},
	) {
		return await new Promise((_resolve, _reject) => {
			const fn = async () =>
				new Promise((resolve, reject) => {
					const uploader = new ChunkedUpload({
						endpoint: `${app.cores.api.client().mainOrigin}/upload/chunk`,
						splitChunkSize: 5 * 1024 * 1024,
						file: file,
						service: service,
						headers: {
							...headers,
							"provider-type": service,
							Authorization: `Bearer ${SessionModel.token}`,
						},
					})

					uploader.events.on("error", ({ message }) => {
						this.console.error("[Uploader] Error", message)

						app.cores.notifications.new(
							{
								title: "Could not upload file",
								description: message,
							},
							{
								type: "error",
							},
						)

						if (typeof onError === "function") {
							onError(file, message)
						}

						reject(message)
						_reject(message)
					})

					uploader.events.on("progress", ({ percentProgress }) => {
						if (typeof onProgress === "function") {
							onProgress(file, percentProgress)
						}
					})

					uploader.events.on("finish", (data) => {
						this.console.debug("[Uploader] Finish", data)

						app.cores.notifications.new(
							{
								title: "File uploaded",
							},
							{
								type: "success",
							},
						)

						if (typeof onFinish === "function") {
							onFinish(file, data)
						}

						resolve(data)
						_resolve(data)
					})
				})

			app.cores.tasksQueue.appendToQueue(`upload_${file.name}`, fn)
		})
	}
}
