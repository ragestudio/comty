import fs from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { SysAudioAddon } from "./types.js"

const require = createRequire(import.meta.url)

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const addonPath = path.resolve(currentDir, "../../addons/sysaudio")

// dlopen cannot read from an asar archive, so packaged builds keep the binary
// inside app.asar and it gets extracted to a real file on first use
function binaryCandidates(): string[] {
	return [
		path.join(addonPath, "dist", "sysaudio.node"),
		path.join(
			addonPath,
			"prebuilds",
			`${process.platform}-${process.arch}`,
			"sysaudio.node",
		),
	]
}

function isFile(target: string): boolean {
	try {
		return fs.statSync(target).isFile()
	} catch {
		return false
	}
}

function isPacked(target: string): boolean {
	return /\.asar[/\\]/.test(target)
}

function readAddonVersion(): string {
	try {
		const manifest = JSON.parse(
			fs.readFileSync(path.join(addonPath, "package.json"), "utf8"),
		) as { version?: string }

		return manifest.version ?? "unknown"
	} catch {
		return "unknown"
	}
}

export const addonVersion = readAddonVersion()

export function isAddonAvailable(): boolean {
	return binaryCandidates().some(isFile)
}

function extractBinary(source: string, cacheRoot: string): string {
	const target = path.join(
		cacheRoot,
		`${addonVersion}-${process.platform}-${process.arch}`,
		"sysaudio.node",
	)

	if (isFile(target)) {
		return target
	}

	fs.mkdirSync(path.dirname(target), { recursive: true })

	const partial = `${target}.tmp`

	fs.copyFileSync(source, partial)
	fs.renameSync(partial, target)

	return target
}

export function resolveAddonBinary(cacheDir?: string): string {
	for (const candidate of binaryCandidates()) {
		if (isFile(candidate) && !isPacked(candidate)) {
			return candidate
		}
	}

	const [source] = binaryCandidates()
	const cacheRoot = cacheDir ?? path.join(os.tmpdir(), "comty-native")

	return extractBinary(source, cacheRoot)
}

export function loadAddon(cacheDir?: string): SysAudioAddon {
	const binary = resolveAddonBinary(cacheDir)

	try {
		return require(binary) as SysAudioAddon
	} catch (error) {
		throw new Error(`failed to load sysaudio native addon from ${binary}`, {
			cause: error,
		})
	}
}
