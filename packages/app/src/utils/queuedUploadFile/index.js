import FilesModel from "@models/files"

export default (file, options) => {
	if (!app.cores.tasksQueue) {
		throw new Error("Missing tasksQueue")
	}

	return app.cores.tasksQueue.appendToQueue(
		`upload_${file.name}`,
		async () => {
			await FilesModel.upload(file, {
				...options,
				onError: (file, error) => {
					app.cores.notifications.new({
						type: "error",
						title: "Could not upload file",
						description: error.message,
					})

					if (typeof options.onError === "function") {
						options.onError(file, error)
					}
				},
				onFinish: (file, data) => {
					app.cores.notifications.new({
						type: "success",
						title: "File uploaded",
						description: `[${file.name}] uploaded successfully!`,
						feedback: false,
					})

					if (typeof options.onFinish === "function") {
						options.onFinish(file, data)
					}
				},
			}).finally((...args) => {
				if (options?.onFinally) {
					options.onFinally(...args)
				}
			})
		},
	)
}
