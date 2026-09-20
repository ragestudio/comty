import createMethod from "./methods/create.js"
import deleteMethod from "./methods/delete.js"
import getMethod from "./methods/get.js"

export default class Track {
	static create = createMethod
	static delete = deleteMethod
	static get = getMethod
}
