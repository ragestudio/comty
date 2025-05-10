export default (buffer) => {
	const bytes = new Uint8Array(buffer)

	let binary = ""

	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i])
	}

	return window.btoa(binary)
}
