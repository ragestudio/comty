export default (): boolean => {
	return Number.parseInt(process.env["ELECTRON_IS_DEV"] ?? "", 10) === 1
}
