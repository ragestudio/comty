// react-native-webrtc exposes toURL on MediaStream. browsers do not support
// object urls for MediaStream, so on web the stream itself has to be bound to
// the media element with srcObject instead of a url
const cache = new WeakMap<MediaStream, string>()

export function getMediaStreamURL(stream: MediaStream): string | null {
	const withToURL = stream as MediaStream & { toURL?: () => string }

	if (typeof withToURL.toURL !== "function") {
		return null
	}

	const cached = cache.get(stream)

	if (cached) return cached

	const url = withToURL.toURL()

	if (url) cache.set(stream, url)

	return url ?? null
}

export function releaseMediaStreamURL(
	stream: MediaStream | null | undefined,
): void {
	if (!stream) return

	cache.delete(stream)
}
