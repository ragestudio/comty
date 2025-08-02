export default (self, fn) => {
	return async (...args) => {
		try {
			await fn(self, ...args)
		} catch (error) {
			self.console.error("Error handling event:", error)
		}
	}
}
