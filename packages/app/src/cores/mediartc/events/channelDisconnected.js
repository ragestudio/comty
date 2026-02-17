export default async (core, data) => {
	core.console.debug("disconencted from channel:", data)

	core.handlers.leaveChannel()
}
