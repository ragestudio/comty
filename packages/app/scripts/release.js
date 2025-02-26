import dotenv from "dotenv"
dotenv.config()

import packagejson from "../package.json" assert { type: "json" }
import path from "path"
import fs from "fs"
import child_process from "child_process"
import { Octokit } from "@octokit/rest"

import compressDistBundle from "./utils/compressDistBundle.js"
import buildAppDist from "./utils/buildAppDist.js"
import createGithubRelease from "./utils/createGithubRelease.js"
import uploadAssets from "./utils/uploadAssets.js"
import composeChangelog from "./utils/composeChangelog.js"

// constants & paths
const repo = "ragestudio/comty"
const packedDistFilename = "dist.zip"

const appSrcPath = path.resolve(process.cwd(), "src")
const appDistPath = path.resolve(process.cwd(), "dist")
const packedDistPath = path.resolve(process.cwd(), packedDistFilename)

async function main() {
	if (!process.env.GITHUB_TOKEN) {
		console.error("🆘 Missing GITHUB_TOKEN env")
		return false
	}

	const octokit = new Octokit({
		auth: process.env.GITHUB_TOKEN,
	})

	let steps = {
		build: true,
		bundle: true,
		publish: true,
		ignoreCommits: false,
		ignoreVersion: false,
		changelog: true,
	}

	let changelogData = null

	if (process.argv.includes("--no-pack")) {
		steps.bundle = false
	}

	if (process.argv.includes("--no-publish")) {
		steps.publish = false
	}

	if (process.argv.includes("--no-build")) {
		steps.build = false
	}

	if (process.argv.includes("--ignore-commits")) {
		steps.ignoreCommits = true
	}

	if (process.argv.includes("--ignore-version")) {
		steps.ignoreVersion = true
	}

	// Verifica si hay cambios pendientes para hacer commit
	if (!steps.ignoreCommits) {
		const gitStatus = child_process
			.execSync("git status --porcelain", {
				cwd: process.cwd(),
			})
			.toString()
			.trim()

		if (gitStatus.length > 0) {
			console.warn(
				"There are pending changes to commit, please commit first.",
			)
			return false
		}
	}

	let currentVersion = packagejson.version

	// Verifica si la versión actual coincide con el último release en GitHub
	const latestRelease = await octokit.repos
		.getLatestRelease({
			owner: repo.split("/")[0],
			repo: repo.split("/")[1],
		})
		.catch((err) => {
			console.error(`🆘 Failed to get latest release: ${err}`)
			return false
		})

	if (!latestRelease) {
		console.error("🆘 Failed to get latest release")
		return false
	}

	if (!steps.ignoreVersion) {
		if (latestRelease && latestRelease.data.tag_name === currentVersion) {
			console.log(
				"🚫 Current version is already latest version, please bump version first. \n - use --bump <patch|minor|major> to automatically bump version. \n - use --ignore-version to force release.",
			)
			return true
		}
	}

	if (steps.build) {
		steps.build = await buildAppDist(appSrcPath)
	}

	if (steps.bundle) {
		steps.bundle = await compressDistBundle(appDistPath, packedDistPath)
	}

	if (steps.changelog) {
		changelogData = await composeChangelog()
	}

	if (steps.publish) {
		const release = await createGithubRelease(
			repo,
			{
				version: currentVersion,
				changelog: changelogData,
			},
			process.env.GITHUB_TOKEN,
		).catch((err) => {
			console.error(
				`🆘 Failed to create release: ${err} >`,
				err.response.data,
			)
			return false
		})

		if (!release) {
			return false
		}

		console.log("🎉 Release done!")

		const assets = await uploadAssets(octokit, repo, release, [
			{
				name: packedDistFilename,
				data: fs.readFileSync(packedDistPath),
			},
		])

		console.log("🎉 Assets uploaded! >", assets)
		console.log(`🔗 ${release.html_url}`)

		fs.unlinkSync(packedDistPath)
	}

	console.log("All Done!")
	return true
}

main().catch((err) => {
	console.error("Fatal error: ", err)
})
