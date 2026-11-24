import type { ReadableStream as NodeWebReadableStream } from "node:stream/web"
import type {
	ActiveDist,
	CheckResult,
	ProductionManifest,
	UpdaterConfig,
	UpdaterInfo,
	UpdaterState,
} from "./types.js"

import { createHash } from "node:crypto"
import { createReadStream, createWriteStream } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { shouldUpdateToManifest } from "./utils.js"

type NormalizedConfig = UpdaterConfig & {
	requireStable: boolean
	allowRollback: boolean
	bundledDistPath: string | null
	requestTimeoutMs: number
	downloadTimeoutMs: number
	downloadAttempts: number
	github: Required<UpdaterConfig["github"]>
}

const STATE_DEFAULTS = {
	activeDate: null,
	activeDistPath: null,
	previousVersion: null,
	previousDate: null,
	previousDistPath: null,
	failedVersion: null,
} satisfies Omit<UpdaterState, "activeVersion">

function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error))
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeSha256(value: string): string {
	return value
		.trim()
		.replace(/^sha256:/i, "")
		.toLowerCase()
}

export class FrontendUpdater {
	private readonly config: NormalizedConfig
	private readonly updatesDir: string
	private readonly statePath: string
	private checkPromise: Promise<CheckResult> | null = null
	private installPromise: Promise<CheckResult> | null = null

	constructor(config: UpdaterConfig) {
		this.config = {
			...config,
			requireStable: config.requireStable ?? true,
			allowRollback: config.allowRollback ?? false,
			bundledDistPath: config.bundledDistPath ?? null,
			requestTimeoutMs: config.requestTimeoutMs ?? 15_000,
			downloadTimeoutMs: config.downloadTimeoutMs ?? 10 * 60_000,
			downloadAttempts: config.downloadAttempts ?? 3,
			github: {
				assetName: "dist.zip",
				...config.github,
			},
		}

		this.updatesDir = path.join(this.config.storageDir, "frontend-updates")
		this.statePath = path.join(this.updatesDir, "state.json")
	}

	async getState(): Promise<UpdaterState> {
		try {
			const raw = await fs.readFile(this.statePath, "utf-8")
			const parsed = JSON.parse(raw) as Partial<UpdaterState>

			if (!parsed || typeof parsed !== "object") {
				throw new Error("Invalid updater state")
			}

			return {
				activeVersion:
					typeof parsed.activeVersion === "string"
						? parsed.activeVersion
						: this.config.bundledVersion,
				activeDate:
					typeof parsed.activeDate === "string"
						? parsed.activeDate
						: STATE_DEFAULTS.activeDate,
				activeDistPath:
					typeof parsed.activeDistPath === "string"
						? parsed.activeDistPath
						: STATE_DEFAULTS.activeDistPath,
				previousVersion:
					typeof parsed.previousVersion === "string"
						? parsed.previousVersion
						: STATE_DEFAULTS.previousVersion,
				previousDate:
					typeof parsed.previousDate === "string"
						? parsed.previousDate
						: STATE_DEFAULTS.previousDate,
				previousDistPath:
					typeof parsed.previousDistPath === "string"
						? parsed.previousDistPath
						: STATE_DEFAULTS.previousDistPath,
				failedVersion:
					typeof parsed.failedVersion === "string"
						? parsed.failedVersion
						: STATE_DEFAULTS.failedVersion,
				manifestEtag:
					typeof parsed.manifestEtag === "string"
						? parsed.manifestEtag
						: undefined,
				lastCheckedAt:
					typeof parsed.lastCheckedAt === "string"
						? parsed.lastCheckedAt
						: undefined,
			}
		} catch {
			return {
				activeVersion: this.config.bundledVersion,
				...STATE_DEFAULTS,
			}
		}
	}

	private async saveState(state: UpdaterState): Promise<void> {
		await fs.mkdir(this.updatesDir, { recursive: true })

		const tmpPath = `${this.statePath}.tmp`

		await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), "utf-8")
		await fs.rename(tmpPath, this.statePath)
	}

	private async isValidDistPath(
		distPath: string | null | undefined,
	): Promise<boolean> {
		if (!distPath) return false

		try {
			const stats = await fs.stat(path.join(distPath, "index.html"))

			return stats.isFile()
		} catch {
			return false
		}
	}

	private async resolveActiveDist(
		state: UpdaterState,
	): Promise<ActiveDist | null> {
		if (await this.isValidDistPath(state.activeDistPath)) {
			return {
				path: state.activeDistPath as string,
				version: state.activeVersion,
				date: state.activeDate,
				source: "update",
			}
		}

		if (
			this.config.bundledDistPath &&
			(await this.isValidDistPath(this.config.bundledDistPath))
		) {
			return {
				path: this.config.bundledDistPath,
				version: this.config.bundledVersion,
				date: null,
				source: "bundled",
			}
		}

		return null
	}

	async getActiveDist(): Promise<ActiveDist | null> {
		return await this.resolveActiveDist(await this.getState())
	}

	async getActiveDistPath(): Promise<string | null> {
		return (await this.getActiveDist())?.path ?? null
	}

	async getInfo(): Promise<UpdaterInfo> {
		const state = await this.getState()
		const active = await this.resolveActiveDist(state)

		return {
			activeVersion: active?.version ?? this.config.bundledVersion,
			activeDate: active?.date ?? null,
			activeDistPath: active?.path ?? null,
			activeSource: active?.source ?? null,
			bundledVersion: this.config.bundledVersion,
			lastCheckedAt: state.lastCheckedAt,
			updatesDir: this.updatesDir,
		}
	}

	private getVersionDir(version: string): string {
		let safeName = version.replace(/[^A-Za-z0-9._-]/g, "_")

		if (!safeName || safeName === "." || safeName === "..") {
			safeName = "_"
		}

		// avoid collisions when different versions sanitize to the same name
		if (safeName !== version) {
			const hash = createHash("sha1").update(version).digest("hex").slice(0, 8)

			safeName = `${safeName}-${hash}`
		}

		return path.join(this.updatesDir, safeName)
	}

	private getDownloadUrl(manifest: ProductionManifest): string {
		if (manifest.url) {
			try {
				const url = new URL(manifest.url, this.config.manifestUrl)

				if (url.protocol !== "https:" && url.protocol !== "http:") {
					throw new Error("unsupported protocol")
				}

				return url.toString()
			} catch {
				throw new Error(`Invalid manifest download url: ${manifest.url}`)
			}
		}

		const { owner, repo, assetName } = this.config.github

		return `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(manifest.version)}/${assetName}`
	}

	private async fetchManifest(
		etag?: string,
	): Promise<
		| { notModified: true }
		| { notModified: false; manifest: ProductionManifest; etag?: string }
	> {
		const headers: Record<string, string> = {
			Accept: "application/json",
			"Cache-Control": "no-cache",
		}

		if (etag) headers["If-None-Match"] = etag

		const res = await fetch(this.config.manifestUrl, {
			headers,
			cache: "no-store",
			redirect: "follow",
			signal: AbortSignal.timeout(this.config.requestTimeoutMs),
		})

		if (res.status === 304) return { notModified: true }

		if (!res.ok) {
			throw new Error(`manifest.json request failed: HTTP ${res.status}`)
		}

		const data = (await res.json()) as Partial<ProductionManifest>

		if (!data || typeof data.version !== "string" || !data.version.trim()) {
			throw new Error("Invalid manifest: missing version")
		}

		if (typeof data.date !== "string" || !data.date.trim()) {
			throw new Error("Invalid manifest: missing date")
		}

		if (typeof data.stable !== "boolean") {
			throw new Error("Invalid manifest: missing stable flag")
		}

		return {
			notModified: false,
			manifest: data as ProductionManifest,
			etag: res.headers.get("etag") ?? undefined,
		}
	}

	private async downloadFile(url: string, destPath: string): Promise<void> {
		await fs.mkdir(path.dirname(destPath), { recursive: true })

		const tmpPath = `${destPath}.part`
		let lastError: unknown = null

		for (let attempt = 1; attempt <= this.config.downloadAttempts; attempt++) {
			try {
				await fs.rm(tmpPath, { force: true })

				const res = await fetch(url, {
					headers: {
						"User-Agent": `${this.config.github.repo}-frontend-updater`,
					},
					redirect: "follow",
					signal: AbortSignal.timeout(this.config.downloadTimeoutMs),
				})

				if (!res.ok || !res.body) {
					throw new Error(`dist download failed: HTTP ${res.status}`)
				}

				await pipeline(
					Readable.fromWeb(res.body as unknown as NodeWebReadableStream),
					createWriteStream(tmpPath),
				)

				await fs.rename(tmpPath, destPath)
				return
			} catch (error) {
				lastError = error

				await fs.rm(tmpPath, { force: true }).catch(() => {})

				if (attempt < this.config.downloadAttempts) {
					console.warn(
						`[updater] download attempt ${attempt} failed, retrying`,
						error,
					)

					await delay(1_000 * attempt)
				}
			}
		}

		throw toError(lastError)
	}

	private async verifyChecksum(
		filePath: string,
		manifest: ProductionManifest,
	): Promise<void> {
		if (!manifest.sha256) return

		const expected = normalizeSha256(manifest.sha256)

		if (!/^[a-f0-9]{64}$/.test(expected)) {
			throw new Error("Invalid manifest checksum format")
		}

		const hash = createHash("sha256")

		await pipeline(createReadStream(filePath), hash)

		const actual = hash.digest("hex")

		if (actual !== expected) {
			throw new Error(
				`dist checksum mismatch (expected ${expected}, got ${actual})`,
			)
		}
	}

	private async resolveExtractedRoot(directory: string): Promise<string> {
		if (await this.isValidDistPath(directory)) return directory

		const entries = await fs.readdir(directory, { withFileTypes: true })

		const candidates = entries
			.filter(
				(entry) =>
					entry.isDirectory() &&
					entry.name !== "__MACOSX" &&
					!entry.name.startsWith("."),
			)
			.map((entry) => path.join(directory, entry.name))

		for (const candidate of candidates) {
			if (await this.isValidDistPath(candidate)) {
				return candidate
			}
		}

		throw new Error("Invalid dist bundle: index.html not found")
	}

	/**
	 * Downloads the dist archive, verifies it and promotes it atomically.
	 */
	private async downloadAndInstall(
		manifest: ProductionManifest,
	): Promise<string> {
		const versionDir = this.getVersionDir(manifest.version)
		const finalDistDir = path.join(versionDir, "dist")
		const zipPath = path.join(versionDir, this.config.github.assetName)
		const tmpExtractDir = path.join(versionDir, "dist.tmp")

		// a previous attempt may have completed the download already
		if (await this.isValidDistPath(finalDistDir)) return finalDistDir

		await fs.mkdir(versionDir, { recursive: true })
		await fs.rm(tmpExtractDir, { recursive: true, force: true })
		await fs.rm(finalDistDir, { recursive: true, force: true })

		try {
			await this.downloadFile(this.getDownloadUrl(manifest), zipPath)
			await this.verifyChecksum(zipPath, manifest)
			await this.config.extractZip(zipPath, tmpExtractDir)

			const extractedRoot = await this.resolveExtractedRoot(tmpExtractDir)

			await fs.rename(extractedRoot, finalDistDir)

			if (extractedRoot !== tmpExtractDir) {
				await fs
					.rm(tmpExtractDir, { recursive: true, force: true })
					.catch(() => {})
			}

			return finalDistDir
		} catch (error) {
			await fs
				.rm(finalDistDir, { recursive: true, force: true })
				.catch(() => {})
			await fs
				.rm(tmpExtractDir, { recursive: true, force: true })
				.catch(() => {})

			throw error
		} finally {
			await fs.rm(zipPath, { force: true }).catch(() => {})
		}
	}

	/**
	 * Keeps only the versions that are still needed (active + previous).
	 */
	private async cleanupOldVersions(
		keepVersions: (string | null | undefined)[],
	): Promise<void> {
		const keep = new Set(
			keepVersions
				.filter(
					(version): version is string =>
						typeof version === "string" && version.length > 0,
				)
				.map((version) => path.basename(this.getVersionDir(version))),
		)

		let entries

		try {
			entries = await fs.readdir(this.updatesDir, { withFileTypes: true })
		} catch {
			return
		}

		await Promise.all(
			entries
				.filter((entry) => entry.isDirectory() && !keep.has(entry.name))
				.map(async (entry) => {
					try {
						await fs.rm(path.join(this.updatesDir, entry.name), {
							recursive: true,
							force: true,
						})
					} catch (error) {
						console.warn(`[updater] failed to remove ${entry.name}`, error)
					}
				}),
		)
	}

	private async install(manifest: ProductionManifest): Promise<CheckResult> {
		if (this.installPromise) return this.installPromise

		const promise = this.runInstall(manifest)

		this.installPromise = promise

		try {
			return await promise
		} finally {
			if (this.installPromise === promise) {
				this.installPromise = null
			}
		}
	}

	private async runInstall(manifest: ProductionManifest): Promise<CheckResult> {
		try {
			const state = await this.getState()
			const previousIsValid = await this.isValidDistPath(state.activeDistPath)
			const distPath = await this.downloadAndInstall(manifest)

			const nextState: UpdaterState = {
				...state,
				activeVersion: manifest.version,
				activeDate: manifest.date,
				activeDistPath: distPath,
				previousVersion: previousIsValid ? state.activeVersion : null,
				previousDate: previousIsValid ? state.activeDate : null,
				previousDistPath: previousIsValid ? state.activeDistPath : null,
				failedVersion:
					state.failedVersion === manifest.version ? null : state.failedVersion,
				lastCheckedAt: new Date().toISOString(),
			}

			await this.saveState(nextState)
			await this.cleanupOldVersions([
				manifest.version,
				previousIsValid ? state.activeVersion : null,
			])

			return { status: "update-ready", manifest, distPath }
		} catch (error) {
			return { status: "error", error: toError(error) }
		}
	}

	/**
	 * Checks the manifest without downloading anything.
	 */
	async check(): Promise<CheckResult> {
		if (this.checkPromise) return this.checkPromise

		const promise = this.runCheck()

		this.checkPromise = promise

		try {
			return await promise
		} finally {
			if (this.checkPromise === promise) {
				this.checkPromise = null
			}
		}
	}

	private async runCheck(): Promise<CheckResult> {
		try {
			const state = await this.getState()
			const activeDist = await this.resolveActiveDist(state)

			// when there is no usable local bundle we cannot trust the cached
			// etag, otherwise a failed first install would never be retried
			const res = await this.fetchManifest(
				activeDist ? state.manifestEtag : undefined,
			)

			if (res.notModified) {
				await this.saveState({
					...state,
					lastCheckedAt: new Date().toISOString(),
				})

				return { status: "up-to-date", version: state.activeVersion }
			}

			const { manifest } = res

			const baseState: UpdaterState = {
				...state,
				manifestEtag: res.etag,
				lastCheckedAt: new Date().toISOString(),
			}

			if (this.config.requireStable && !manifest.stable) {
				await this.saveState(baseState)

				return { status: "skipped-unstable", manifest }
			}

			if (state.failedVersion && state.failedVersion === manifest.version) {
				await this.saveState(baseState)

				return { status: "up-to-date", version: state.activeVersion }
			}

			if (
				activeDist &&
				!shouldUpdateToManifest(
					manifest,
					state.activeVersion,
					state.activeDate,
					this.config.allowRollback,
				)
			) {
				await this.saveState(baseState)

				return { status: "up-to-date", version: state.activeVersion }
			}

			// do not persist the etag before the install succeeds so a failed
			// download is retried on the next check
			return { status: "update-available", manifest }
		} catch (error) {
			return { status: "error", error: toError(error) }
		}
	}

	async checkAndUpdate(): Promise<CheckResult> {
		const result = await this.check()

		if (result.status !== "update-available") return result

		return await this.install(result.manifest)
	}

	/**
	 * Reverts to the previous version (or the bundled one) after a load failure.
	 */
	async rollback(): Promise<UpdaterState> {
		const state = await this.getState()
		const previousIsValid = await this.isValidDistPath(state.previousDistPath)

		const nextState: UpdaterState = {
			...state,
			activeVersion: previousIsValid
				? (state.previousVersion ?? this.config.bundledVersion)
				: this.config.bundledVersion,
			activeDate: previousIsValid ? (state.previousDate ?? null) : null,
			activeDistPath: previousIsValid ? (state.previousDistPath ?? null) : null,
			previousVersion: null,
			previousDate: null,
			previousDistPath: null,
			failedVersion: state.activeVersion || state.failedVersion,
			manifestEtag: undefined,
		}

		await this.saveState(nextState)
		await this.cleanupOldVersions([
			previousIsValid ? state.previousVersion : null,
		])

		return nextState
	}
}
