import { Message } from "../collections/message"

export default (arr: Message[]) => {
	return arr.sort((a, b) => {
		if (a._id > b._id) {
			return -1
		}

		if (a._id < b._id) {
			return 1
		}

		return 0
	})
}
