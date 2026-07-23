import SFU from "./index"

try {
	const sfu = new SFU()
	sfu.initialize()
} catch (error) {
	console.error(error)
}
