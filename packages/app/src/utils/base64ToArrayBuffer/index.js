export default (base64) => {
	const binaryString = window.atob(base64)

	const bytes = new Uint8Array(binaryString.length)

	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}

	return bytes
}
