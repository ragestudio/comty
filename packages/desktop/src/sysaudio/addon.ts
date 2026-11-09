import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { SysAudioAddon } from "./types.js"

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const addonPath = path.resolve(currentDir, "../../addons/sysaudio")

// prefer the locally compiled binary (dev and packaging) and fall back to the
// prebuilt one shipped with the addon
function resolveSysAudioBinary(): string {
	const compiled = path.join(addonPath, "dist", "sysaudio.node")

	if (fs.existsSync(compiled)) {
		return compiled
	}

	return path.join(
		addonPath,
		"prebuilds",
		`${process.platform}-${process.arch}`,
		"sysaudio.node",
	)
}

export function loadAddon(): SysAudioAddon {
	const require = createRequire(import.meta.url)

	return require(resolveSysAudioBinary()) as SysAudioAddon
}
