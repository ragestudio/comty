export default class VirtualWindow {
	constructor(controller, id, params) {
		if (!controller) {
			throw new Error("Window controller is required")
		}

		if (!id) {
			throw new Error("Window ID is required")
		}

		if (!params) {
			throw new Error("Window params are required")
		}

		this.controller = controller
		this.id = id
		this.params = params
	}

	close = async () => {}
}
