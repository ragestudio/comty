const fs = require("fs")
const path = require("path")
const axios = require("axios")
const _7z = require("7zip-min")
const { Octokit } = require("@octokit/rest")

const octokit = new Octokit({
    // auth: process.env.GITHUB_TOKEN
})

async function getLatestReleaseBundleFromGithub() {
    console.log("Getting latest release bundle from github...")

    const release = await octokit.repos.getLatestRelease({
        owner: global.remoteRepo.split("/")[0],
        repo: global.remoteRepo.split("/")[1]
    })

    const bundle = release.data.assets.find(asset => asset.name === "app_dist.7z")

    return bundle
}

async function downloadBundle(bundle) {
    // check if bundle exists
    if (fs.existsSync(path.join(global.cachePath, "app_dist.7z"))) {
        fs.unlinkSync(path.join(global.cachePath, "app_dist.7z"))
    }

    console.log("Downloading bundle...")

    const response = await axios.get(bundle.browser_download_url, {
        responseType: "stream"
    })

    const writer = fs.createWriteStream(path.join(global.cachePath, "app_dist.7z"))

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve)
        writer.on("error", reject)
    })
}

async function extractBundle() {
    return new Promise((resolve, reject) => {
        console.log("Extracting bundle...")

        _7z.unpack(path.join(global.cachePath, "app_dist.7z"), path.resolve(global.distPath, ".."), (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(global.distPath)
            }
        })
    })
}

async function setupLatestRelease() {
    // create cache folder
    if (!fs.existsSync(global.cachePath)) {
        fs.mkdirSync(global.cachePath)
    }

    // create dist folder
    if (!fs.existsSync(global.distPath)) {
        fs.mkdirSync(global.distPath)
    }

    const bundle = await getLatestReleaseBundleFromGithub()

    await downloadBundle(bundle)

    const bundlePath = await extractBundle()

    console.log(`Bundle extracted to ${bundlePath}`)

    console.log("Cleaning up...")

    // delete cache folder
    if (fs.existsSync(global.cachePath)) {
        fs.rmdirSync(global.cachePath, { recursive: true })
    }
}

module.exports = {
    getLatestReleaseBundleFromGithub,
    downloadBundle,
    extractBundle,
    setupLatestRelease,
}