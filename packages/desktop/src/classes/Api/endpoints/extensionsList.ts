import type { ApiRoute } from "../types.js"

const route: ApiRoute = {
	path: "/extensions/list",
	method: "get",
	handler: async (req, res, main) => {
		return main.extensions.valuesSerialized()
	},
}

export default route
