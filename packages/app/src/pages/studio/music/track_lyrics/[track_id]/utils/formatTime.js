export default (seconds) => {
	if (!seconds || isNaN(seconds)) {
		return "00:00.000"
	}

	const minutes = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	const ms = Math.floor((seconds % 1) * 1000)

	return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}
