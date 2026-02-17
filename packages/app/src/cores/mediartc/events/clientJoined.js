export default async (core, data) => {
	try {
		await core.clients.join(data)
	} catch (error) {
		core.console.error("Error handling client joined:", error)
	}
}
