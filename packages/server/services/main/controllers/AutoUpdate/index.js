import { Controller } from "linebridge/dist/server"

import { Octokit } from "@octokit/rest"

const octokit = new Octokit({})

const endpoints = {
    post: {
        "/mobile": {
            fn: async (req, res) => {
                if (!process.env.GITHUB_REPO) {
                    return res.status(400).json({
                        error: "GITHUB_REPO env variable not set"
                    })
                }

                const lastRelease = await octokit.repos.getLatestRelease({
                    owner: process.env.GITHUB_REPO.split("/")[0],
                    repo: process.env.GITHUB_REPO.split("/")[1]
                })

                const bundle = lastRelease.data.assets.find((asset) => asset.name === "mobile_dist.zip")
                const version = lastRelease.data.tag_name

                if (!bundle) {
                    return res.status(400).json({
                        error: "mobile asset not available",
                        version: version,
                    })
                }

                return res.json({
                    url: bundle.browser_download_url,
                    version: version,
                })
            }
        }
    }
}

export default class AutoUpdate extends Controller {
    static refName = "AutoUpdate"
    static useRoute = "/auto-update"

    httpEndpoints = endpoints
}