import MediaRTC from "../mediartc.core"

export default (
	self: MediaRTC,
	fn: (core: MediaRTC, ...args: any[]) => Promise<void>,
) => {
	return async (...args: any[]) => {
		try {
			await fn(self, ...args)
		} catch (error) {
			self.console.error("Error handling event:", error)
		}
	}
}
