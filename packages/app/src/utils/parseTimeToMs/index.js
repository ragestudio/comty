export default (timeStr) => {
	const [minutes, seconds, milliseconds] = timeStr.split(":")

	return (
		Number(minutes) * 60 * 1000 +
		Number(seconds) * 1000 +
		Number(milliseconds)
	)
}
