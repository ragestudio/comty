export default {
	path: "/extensions/list",
	method: "get",
	handler: async (req, res, main) => {
		return main.extensions.valuesSerialized()
	},
}
