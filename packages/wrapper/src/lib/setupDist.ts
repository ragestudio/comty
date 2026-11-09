import fs from "node:fs"
import path from "node:path"

import downloadFile from "./downloadFile"
import extractCompressedFile from "./extractCompressedFile"
import {
	DEFAULT_DIST_ASSET_NAME,
	DEFAULT_RELEASE_TAG_PREFIX,
	getLatestReleaseWithAsset,
	type ReleaseWithAsset,
} from "./releases"

export interface ReleaseManifest {
	version: string
	date: string | null
	stable: boolean
}

export interface SetupLatestReleaseOptions {
	repository: string
	destinationPath: string
	cachePath: string
	assetName?: string
	tagPrefix?: string
	distDirectoryName?: string
	maxPages?: number
}

async function writeReleaseManifest(
	manifestPath: string,
	manifest: ReleaseManifest,
) {
	const temporaryPath = `${manifestPath}.tmp`
	const content = JSON.stringify(manifest)

	await fs.promises.writeFile(temporaryPath, content)
	await fs.promises.rename(temporaryPath, manifestPath)
}

export async function readReleaseManifest(
	manifestPath: string,
): Promise<ReleaseManifest | null> {
	try {
		const content = await fs.promises.readFile(manifestPath, "utf8")
		const data = JSON.parse(content) as Partial<ReleaseManifest>

		if (typeof data.version !== "string" || data.version.length === 0) {
			return null
		}

		return {
			version: data.version,
			date: typeof data.date === "string" ? data.date : null,
			stable: data.stable === true,
		}
	} catch {
		return null
	}
}

async function replaceDirectory(sourcePath: string, destinationPath: string) {
	await fs.promises.rm(destinationPath, { recursive: true, force: true })

	try {
		await fs.promises.rename(sourcePath, destinationPath)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EXDEV") {
			throw error
		}

		await fs.promises.cp(sourcePath, destinationPath, { recursive: true })
		await fs.promises.rm(sourcePath, { recursive: true, force: true })
	}
}

/**
 * Downloads and installs the latest release bundle without removing the
 * currently installed dist until the new bundle is fully extracted.
 */
export async function setupLatestRelease(
	{
		repository,
		destinationPath,
		cachePath,
		assetName = DEFAULT_DIST_ASSET_NAME,
		tagPrefix = DEFAULT_RELEASE_TAG_PREFIX,
		distDirectoryName = "app-release-files",
		maxPages,
	}: SetupLatestReleaseOptions,
	resolvedRelease?: ReleaseWithAsset,
): Promise<ReleaseManifest> {
	const distPath = path.join(destinationPath, distDirectoryName)
	const manifestPath = path.join(destinationPath, "manifest.json")
	const archivePath = path.join(cachePath, assetName)
	const stagingPath = path.join(cachePath, "staging")

	await Promise.all([
		fs.promises.mkdir(cachePath, { recursive: true }),
		fs.promises.mkdir(destinationPath, { recursive: true }),
	])

	try {
		const releaseWithAsset =
			resolvedRelease ??
			(await getLatestReleaseWithAsset({
				repository,
				assetName,
				tagPrefix,
				maxPages,
			}))

		if (!releaseWithAsset) {
			throw new Error(
				`No release found with tag prefix "${tagPrefix}" and asset "${assetName}"`,
			)
		}

		const { release, asset } = releaseWithAsset

		console.log(`Release: > ${release.tag_name} [${release.html_url}]`)
		console.log(`Bundle: > ${asset.name} [${asset.browser_download_url}]`)

		await downloadFile(asset.browser_download_url, archivePath)

		await fs.promises.rm(stagingPath, { recursive: true, force: true })
		await fs.promises.mkdir(stagingPath, { recursive: true })
		await extractCompressedFile(archivePath, stagingPath)

		const extractedDistPath = path.join(stagingPath, distDirectoryName)
		const sourcePath = fs.existsSync(extractedDistPath)
			? extractedDistPath
			: stagingPath

		await replaceDirectory(sourcePath, distPath)

		const manifest: ReleaseManifest = {
			version: release.tag_name,
			date: release.published_at,
			stable: !release.prerelease,
		}

		await writeReleaseManifest(manifestPath, manifest)

		console.log(`Bundle extracted to > ${distPath}`)
		console.log("Dist setup complete")

		return manifest
	} finally {
		await fs.promises.rm(cachePath, { recursive: true, force: true })
	}
}
