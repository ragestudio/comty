import { Octokit } from "@octokit/rest"
import axios from "axios"

const octokit = new Octokit({})

export default {
    method: "GET",
    route: "/release-notes",
    fn: async (req, res) => {
        if (!process.env.GITHUB_REPO) {
            return res.status(400).json({
                error: "GITHUB_REPO env variable not set"
            })
        }

        const releasesNotes = []

        // fetch the 3 latest releases
        const releases = await octokit.repos.listReleases({
            owner: process.env.GITHUB_REPO.split("/")[0],
            repo: process.env.GITHUB_REPO.split("/")[1],
            per_page: 3
        })

        for await (const release of releases.data) {
            let changelogData = release.body

            const bundle = release.assets.find((asset) => asset.name === "changelog.md")

            if (bundle) {
                const response = await axios.get(bundle.browser_download_url)
                    .catch(() => null)

                if (response) {
                    changelogData = response.data
                }
            }

            releasesNotes.push({
                version: release.tag_name,
                date: release.published_at,
                body: changelogData,
                isMd: bundle !== undefined
            })
        }

        return res.json(releasesNotes)
    }
}