export default async (core, data) => {
	try {
		await core.clients.leave(data.userId)
	} catch (error) {
		core.console.error("Error handling client left:", error)
	}
}
