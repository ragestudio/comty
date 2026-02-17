export default {
	useContexts: ["cache", "limits"],
	fn: async () => {
		return this.default.contexts.limits
	},
}
