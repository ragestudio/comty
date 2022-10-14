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

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
})

async function getChangeLogString() {
    // get latest tag
    const latestTag = await octokit.repos.getLatestRelease({
        owner: repo.split("/")[0],
        repo: repo.split("/")[1]
    })

    // get commits since latest tag
    const commits = await octokit.repos.listCommits({
        owner: repo.split("/")[0],
        repo: repo.split("/")[1],
        since: latestTag.data.published_at
    })

    const changelog = commits.data.map((commit) => {
        return {
            message: commit.commit.message,
            author: commit.commit.author.name,
            url: commit.html_url,
        }
    })

    // make a string from the changes with Markdown syntax
    const changelogString = changelog.map((commit) => {
        return `* [${commit.message}](${commit.url}) - ${commit.author}`
    }).join("\n")

    return changelogString
}

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
    if (process.argv.includes("--noCompress")) {
        console.log("🔥 Skipping build due to `noBuild` argument")
        return true
    }

    // compress with 7zip
    console.log("⚒  Compressing app...")

    const outPath = path.resolve(appDistPath, "../app_dist.7z")

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

async function uploadAssets({ release, bundlePath }) {
    console.log("⚒  Uploading assets...")

    console.log(`ReleaseID: ${release.id}`)

    const appDistAsset = await octokit.repos.uploadReleaseAsset({
        release_id: release.id,
        owner: repo.split("/")[0],
        repo: repo.split("/")[1],
        name: "app_dist.7z",
        data: fs.readFileSync(bundlePath)
    })

    if (!appDistAsset) {
        return false
    }

    console.log("⚒  Uploading assets done!")

    return true
}

async function main() {
    await createAppDistBundle()
    const bundlePath = await compressDistBundle()

    const changelog = await getChangeLogString()

    const release = await createGithubRelease({
        version: packagejson.version,
        changelog,
    }).catch((err) => {
        console.error(`🆘 Failed to create release: ${err}`)
        return false
    })

    if (!release) return

    const assets = await uploadAssets({ release, bundlePath }).catch((err) => {
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