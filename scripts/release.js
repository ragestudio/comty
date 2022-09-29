require("dotenv").config()

const packagejson = require("../package.json")

const path = require("path")
const fs = require("fs")
const child_process = require("child_process")
const { Octokit } = require("@octokit/rest")
const axios = require("axios")

const repo = "ragestudio/comty"
const appSrcPath = path.resolve(__dirname, "../packages/app/src")

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

    return response.data
}

async function createAppDistBundle() {
    // build app for production
    console.log("⚒  Building app...")
    await child_process.execSync("yarn build", {
        cwd: appSrcPath,
        stdio: "inherit"
    })
    console.log("⚒  Building app done!")

    // compress with tar
    console.log("⚒  Compressing app...")
    await child_process.execSync("tar -czf app_dist.tar.gz dist", {
        cwd: appSrcPath,
        stdio: "inherit"
    })
    console.log("⚒  Compressing app done!")
}

async function main() {
    await createAppDistBundle()

    console.log("⚒  Creating release...")

    const changelog = await getChangeLogString()

    const release = await createGithubRelease({
        version: packagejson.version,
        changelog,
    }).catch((err) => {
        console.error(`🆘 Failed to create release: ${err}`)
        return false
    })

    if (!release) {
        return
    }

    console.log("⚒  Creating release done!")

    console.log("⚒  Uploading assets...")

    const appDistAsset = await octokit.repos.uploadReleaseAsset({
        url: release.upload_url,
        headers: {
            "content-type": "application/gzip",
            "content-length": fs.statSync(path.resolve(appSrcPath, "app_dist.tar.gz")).size
        },
        name: "app_dist.tar.gz",
        file: fs.createReadStream(path.resolve(appSrcPath, "app_dist.tar.gz"))
    }).catch((err) => {
        console.error(`🆘 Failed to upload asset: ${err}`)
        return false
    })

    if (!appDistAsset) {
        return
    }

    console.log("⚒  Uploading assets done!")
}

main().catch((err) => {
    console.error(`Fatal error: `, err)
})