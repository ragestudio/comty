require("dotenv").config()

const packagejson = require("../package.json")

const path = require("path")
const fs = require("fs")
const child_process = require("child_process")
const { Octokit } = require("@octokit/rest")
const sevenzip = require("7zip-min")
const axios = require("axios")

const repo = "ragestudio/comty"
const appSrcPath = path.resolve(process.cwd(), "packages/app/src")
const appDistPath = path.resolve(process.cwd(), "packages/app/dist")
const changelogsPath = path.resolve(process.cwd(), "changelogs")

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
})

const composeChangelog = require("./utils/composeChangelog")
const bumpVersion = require("./utils/bumpVersion")

async function createGithubRelease(payload) {
    if (process.argv.includes("--noPublish")) {
        console.log("🔥 Skipping release creation due to `noPublish` argument")
        return true
    }

    const { version, changelog } = payload

    const response = await axios({
        method: "post",
        url: `https://api.github.com/repos/${repo}/releases`,
        headers: {
            "Authorization": `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        data: {
            tag_name: version,
            name: `v${version}`,
            body: changelog
        }
    })

    console.log("⚒  Creating release done!")

    return response.data
}

async function createAppDistBundle() {
    // check if has `noBuild` argument
    if (process.argv.includes("--noBuild")) {
        console.log("🔥 Skipping build due to `noBuild` argument")
        return true
    }

    // build app for production
    console.log("⚒  Building app...")
    await child_process.execSync("yarn build", {
        cwd: appSrcPath,
        stdio: "inherit"
    })
    console.log("⚒  Building app done!")

    return appDistPath
}

async function compressDistBundle() {
    const outPath = path.resolve(appDistPath, "../app_dist.7z")

    if (process.argv.includes("--noCompress") || process.argv.includes("--noBuild")) {
        console.log("🔥 Skipping compress due to `noBuild` or `noCompress` argument")
        return outPath
    }

    // compress with 7zip
    console.log("⚒  Compressing app...")

    // check if out file exists
    if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath)
    }

    await new Promise((resolve, reject) => {
        sevenzip.pack(appDistPath, outPath, (err) => {
            if (err) {
                return reject(err)
            }

            return resolve(outPath)
        })
    })

    console.log("⚒  Compressing app done! > " + outPath)

    return outPath
}

async function uploadAssets({ release, bundlePath, changelogFilepath }) {
    // check if has `noPublish` argument, if true, skip uploading assets
    if (process.argv.includes("--noPublish")) {
        console.log("🔥 Skipping upload assets due to `noPublish` argument")
        return true
    }

    console.log("⚒  Uploading assets...")

    console.log(`ReleaseID: ${release.id}`)

    const appDistAsset = await octokit.repos.uploadReleaseAsset({
        release_id: release.id,
        owner: repo.split("/")[0],
        repo: repo.split("/")[1],
        name: "app_dist.7z",
        data: fs.readFileSync(bundlePath)
    })

    const changelogAsset = await octokit.repos.uploadReleaseAsset({
        release_id: release.id,
        owner: repo.split("/")[0],
        repo: repo.split("/")[1],
        name: "changelog.md",
        data: fs.readFileSync(changelogFilepath)
    })

    if (!appDistAsset) {
        return false
    }

    if (!changelogAsset) {
        return false
    }

    console.log("⚒  Uploading assets done!")

    return true
}

async function main() {
    // check if no GITHUB_TOKEN env
    if (!process.env.GITHUB_TOKEN) {
        console.error("🆘 Missing GITHUB_TOKEN env")
        return false
    }

    // check if is any changes pending to commit
    const gitStatus = child_process.execSync("git status --porcelain", {
        cwd: process.cwd()
    }).toString().trim()

    if (gitStatus.length > 0) {
        console.error("🆘 There are pending changes to commit, please commit first.")
        return false
    }

    let currentVersion = packagejson.version

    // check if currentVersion match with current latest release on github
    const latestRelease = await octokit.repos.getLatestRelease({
        owner: repo.split("/")[0],
        repo: repo.split("/")[1]
    }).catch((err) => {
        console.error(`🆘 Failed to get latest release: ${err}`)
        return false
    })

    if (latestRelease && latestRelease.data.tag_name === currentVersion && !process.argv.includes("--force")) {
        if (process.argv.includes("--bump")) {
            const bumpType = process.argv[process.argv.indexOf("--bump") + 1]

            const newVersion = await bumpVersion({
                root: process.cwd(),
                type: bumpType,
                count: 1
            }).catch((error) => {
                console.error(`🆘 Failed to bump version >`, error)
                return false
            })

            if (!newVersion) {
                throw new Error("Failed to bump version")
            }

            currentVersion = newVersion

            // create new commit
            await child_process.execSync(`git add . && git commit -m "Bump version to ${currentVersion}"`, {
                cwd: process.cwd(),
                stdio: "inherit"
            })

            // push to remote
            await child_process.execSync(`git push`, {
                cwd: process.cwd(),
                stdio: "inherit"
            })
        } else {
            console.log("🚫 Current version is already latest version, please bump version first. \n - use --bump <patch|minor|major> to automatically bump version. \n - use --force to force release.")
            return true
        }
    }

    if (!latestRelease) return

    await createAppDistBundle()

    const bundlePath = await compressDistBundle()

    const changelog = await composeChangelog()

    const changelogFilepath = path.resolve(changelogsPath, `v${currentVersion.split(".").join("-")}.md`)

    console.log(`📝 Writing changelog to file > ${changelogFilepath}`)

    // write changelog to file
    fs.writeFileSync(changelogFilepath, changelog)

    const release = await createGithubRelease({
        version: currentVersion,
        changelog,
    }).catch((err) => {
        console.error(`🆘 Failed to create release: ${err}`)
        return false
    })

    if (!release) return

    const assets = await uploadAssets({ release, bundlePath, changelogFilepath }).catch((err) => {
        console.error(`🆘 Failed to upload asset: ${err}`, err.response)
        return false
    })

    if (!assets) return

    console.log("🎉 Release done!")
    console.log(`🔗 ${release.html_url}`)
}

main().catch((err) => {
    console.error(`Fatal error: `, err)
})