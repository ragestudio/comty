import { Duplex } from "node:stream"

export default (bf) => {
	let tmp = new Duplex()

	tmp.push(bf)
	tmp.push(null)

	return tmp
}
