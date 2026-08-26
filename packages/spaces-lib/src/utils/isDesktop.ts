export default function () {
	// first check if we are in a vessel app environment
	if (typeof window === "undefined") return false
	if (typeof globalThis.app === "undefined") return false
	if (typeof globalThis.app.isDesktop === "undefined") return false

	return globalThis.app.isDesktop
}
