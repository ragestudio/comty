require("dotenv").config()

// dependencies
const packagejson = require("../package.json")
const path = require("path")
const fs = require("fs")
const child_process = require("child_process")
const { Octokit } = require("@octokit/rest")

// utils
const compressDistBundle = require("./utils/compressDistBundle")
const buildAppDist = require("./utils/buildAppDist")
const createGithubRelease = require("./utils/createGithubRelease")
const uploadAssets = require("./utils/uploadAssets")
const composeChangelog = require("./utils/composeChangelog")
const bumpVersion = require("./utils/bumpVersion")

// constants & paths
const repo = "ragestudio/comty"
const appSrcPath = path.resolve(process.cwd(), "packages/app/src")
const appDistPath = path.resolve(process.cwd(), "packages/app/dist")
const changelogsPath = path.resolve(process.cwd(), "changelogs")
const packedDistPath = path.resolve(appDistPath, "dist.zip")

async function main() {
    if (!process.env.GITHUB_TOKEN) {
        console.error("🆘 Missing GITHUB_TOKEN env")
        return false
    }

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    })

    let steps = {
        build: true,
        bundle: true,
        publish: true,
        ignoreCommits: false,
        ignoreVersion: false,
        changelog: true,
    }

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

    // check if is any changes pending to commit
    if (!steps.ignoreCommits) {
        const gitStatus = child_process.execSync("git status --porcelain", {
            cwd: process.cwd()
        }).toString().trim()

        if (gitStatus.length > 0) {
            console.warn("There are pending changes to commit, please commit first.")
            return false
        }
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

    if (!latestRelease) {
        console.error("🆘 Failed to get latest release")
        return false
    }

    if (!steps.ignoreVersion) {
        if (latestRelease && latestRelease.data.tag_name === currentVersion) {
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
                console.log("🚫 Current version is already latest version, please bump version first. \n - use --bump <patch|minor|major> to automatically bump version. \n - use --ignore-version to force release.")
                return true
            }
        }
    }

    if (steps.build) {
        steps.build = await buildAppDist(appSrcPath)
    }

    if (steps.bundle) {
        steps.bundle = await compressDistBundle(appDistPath, packedDistPath)
    }

    if (steps.changelog) {
        const changelog = await composeChangelog()

        steps.changelog = path.resolve(changelogsPath, `v${currentVersion.split(".").join("-")}.md`)

        console.log(`📝 Writing changelog to file > ${steps.changelog}`)

        // write changelog to file
        fs.writeFileSync(steps.changelog, changelog)
    }

    if (steps.publish) {
        const release = await createGithubRelease(
            repo,
            {
                version: currentVersion,
                changelog,
            },
            process.env.GITHUB_TOKEN,
        ).catch((err) => {
            console.error(`🆘 Failed to create release: ${err}`)
            return false
        })

        console.log("🎉 Release done!")

        if (!release) {
            return false
        }

        const assets = await uploadAssets(
            octokit,
            repo,
            release,
            [
                {
                    name: packedDistPath,
                    data: fs.readFileSync(packedDistPath)
                },
                {
                    name: "changelog.md",
                    data: fs.readFileSync(steps.changelog)
                }
            ],
        )

        console.log("🎉 Assets uploaded! >", assets)

        console.log(`🔗 ${release.html_url}`)
    }

    console.log("All Done!")

    return true
}

main().catch((err) => {
    console.error(`Fatal error: `, err)
})