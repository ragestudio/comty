export default (uri) => {
	const manifest = uri.split("inline://")[1]
	const [baseUri, manifestString] = manifest.split("::")

	const response = {
		data: new Uint8Array(new TextEncoder().encode(manifestString)).buffer,
		headers: {},
		uri: baseUri,
		originalUri: baseUri,
		timeMs: performance.now(),
		fromCache: true,
	}

	return Promise.resolve(response)
}
