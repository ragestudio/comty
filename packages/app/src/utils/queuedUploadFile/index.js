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
					app.cores.notifications.new(
						{
							title: "Could not upload file",
							description: error.message,
						},
						{
							type: "error",
						},
					)

					if (typeof options.onError === "function") {
						options.onError(file, error)
					}
				},
				onFinish: (file, data) => {
					app.cores.notifications.new(
						{
							title: "File uploaded",
							description: `[${file.name}] uploaded successfully!`,
						},
						{
							type: "success",
						},
					)

					if (typeof options.onFinish === "function") {
						options.onFinish(file, data)
					}
				},
			})
		},
	)
}
