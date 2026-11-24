import type { ProductionManifest } from "./types.js"

function parseSemver(version: string) {
	const clean = version.trim().replace(/^v/, "").split("+")[0]
	const [core] = clean.split("-", 1)
	const [major = 0, minor = 0, patch = 0] = core.split(".").map(Number)

	return { major, minor, patch }
}

export function isNativeCompatible(
	requiredNative: string,
	currentNative: string,
): boolean {
	const req = parseSemver(requiredNative)
	const cur = parseSemver(currentNative)

	if (req.major !== cur.major) return false
	if (req.major === 0) {
		return req.minor === cur.minor && req.patch <= cur.patch
	}

	return req.minor <= cur.minor
}

function parseTimestamp(value: string | null | undefined): number | null {
	if (!value) return null

	const timestamp = Date.parse(value)

	return Number.isNaN(timestamp) ? null : timestamp
}

function compareReleaseTags(remote: string, local: string): number | null {
	const parseTag = (tag: string) => /^rel-(\d{6})_(\d+)$/.exec(tag)

	const remoteTag = parseTag(remote)
	const localTag = parseTag(local)

	if (!remoteTag || !localTag) return null

	const dateDiff = Number(remoteTag[1]) - Number(localTag[1])
	if (dateDiff !== 0) return dateDiff

	return Number(remoteTag[2]) - Number(localTag[2])
}

export function shouldUpdateToManifest(
	remote: ProductionManifest,
	localVersion: string,
	localDate: string | null,
	allowRollback: boolean,
): boolean {
	// the same tag can be rebuilt; only update when the manifest is newer
	if (remote.version === localVersion) {
		const remoteTimestamp = parseTimestamp(remote.date)
		const localTimestamp = parseTimestamp(localDate)

		if (remoteTimestamp === null || localTimestamp === null) {
			return false
		}

		return remoteTimestamp > localTimestamp
	}

	if (allowRollback) return true

	const remoteTimestamp = parseTimestamp(remote.date)
	const localTimestamp = parseTimestamp(localDate)

	if (remoteTimestamp !== null && localTimestamp !== null) {
		if (remoteTimestamp !== localTimestamp) {
			return remoteTimestamp > localTimestamp
		}
	}

	const tagComparison = compareReleaseTags(remote.version, localVersion)

	if (tagComparison !== null) {
		return tagComparison > 0
	}

	// unknown version format: prefer installing the manifest version
	return true
}
