import fs from "node:fs"
import path from "node:path"
import { Octokit } from "@octokit/rest"

import downloadFile from "./downloadFile"
import extractCompressedFile from "./extractCompressedFile"

const octokit = new Octokit()

async function getLatestReleaseFromGithub(repoStr) {
	console.log("Getting latest release from github...")

	const release = await octokit.repos.getLatestRelease({
		owner: repoStr.split("/")[0],
		repo: repoStr.split("/")[1],
	})

	return release.data
}

async function findBundleFromRelease(release, distCompressedFile) {
	const bundle = release.assets.find(
		(asset) => asset.name === distCompressedFile,
	)

	return bundle
}

async function setupLatestRelease({
	cachePath,
	destinationPath,
	repository,
	distCompressedFile,
}) {
	// create cache folder
	if (!fs.existsSync(cachePath)) {
		fs.mkdirSync(cachePath)
	}

	// create dist folder
	if (!fs.existsSync(destinationPath)) {
		fs.mkdirSync(destinationPath)
	}

	const release = await getLatestReleaseFromGithub(repository)

	console.log(`Latest release: > ${release.tag_name} [${release.url}]`)

	const bundle = await findBundleFromRelease(release, distCompressedFile)

	if (!bundle) {
		throw new Error(
			`Bundle not available for latest release: ${distCompressedFile}`,
		)
	}

	console.log(`Bundle: > ${bundle.name} [${bundle.browser_download_url}]`)

	// wirte a manifest file with bundle version and other info
	fs.writeFileSync(
		path.join(destinationPath, "manifest.json"),
		JSON.stringify({
			version: release.tag_name,
			date: release.published_at,
			stable: !release.prerelease,
		}),
	)

	await downloadFile(
		bundle.browser_download_url,
		cachePath,
		distCompressedFile,
	)

	await extractCompressedFile(
		path.join(cachePath, distCompressedFile),
		destinationPath,
	)

	console.log(`Bundle extracted to > ${destinationPath}`)

	// delete cache folder
	if (fs.existsSync(cachePath)) {
		fs.rmdirSync(cachePath, { recursive: true })
	}
}

module.exports = {
	downloadBundle: downloadFile,
	extractBundle: extractCompressedFile,
	setupLatestRelease,
}
