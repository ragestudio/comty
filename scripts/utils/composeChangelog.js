require("dotenv").config()

const { Octokit } = require("@octokit/rest")
const repo = "ragestudio/comty"

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
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

    let changelog = commits.data.map(async (commit) => {
        const commitData = await octokit.repos.getCommit({
            owner: repo.split("/")[0],
            repo: repo.split("/")[1],
            ref: commit.sha
        })

        const filenamesChanged = commitData.data.files.map((file) => {
            return file.filename
        })

        // check packages involved in each commit
        let packagesChanged = filenamesChanged.map((file) => {
            // search for the pkg name in the path (eg packages/app/src/...)
            const pkg = file.split("/")[1]

            // if the pkg is not found, return null
            if (!pkg) return null

            return pkg
        })

        // filter out null values
        packagesChanged = packagesChanged.filter((pkg) => {
            return pkg !== null
        })

        // remove duplicates
        packagesChanged = [...new Set(packagesChanged)]

        // if no packages changed, return "internal"
        if (packagesChanged.length === 0) {
            packagesChanged = ["internal"]
        }

        return {
            message: commitData.data.commit.message,
            author: commitData.data.commit.author.name,
            authorUrl: commitData.data.author.html_url,
            url: commit.html_url,
            filenamesChanged: filenamesChanged,
            files: commitData.data.files,
            packages: packagesChanged,
        }
    })

    changelog = await Promise.all(changelog)

    // make a string from the changes with Markdown syntax
    let changelogString = changelog.map((commit) => {
        const additions = commit.files.map((file) => {
            return file.additions
        }).reduce((a, b) => a + b, 0)

        const deletions = commit.files.map((file) => {
            return file.deletions
        }).reduce((a, b) => a + b, 0)

        return `* [+${additions}/-${deletions}][${commit.packages.join(" | ")}] [${commit.message}](${commit.url}) - by [@${commit.author}](${commit.authorUrl})`
    }).join("\n")

    changelogString = changelogString.trim()

    return changelogString
}

module.exports = getChangeLogString