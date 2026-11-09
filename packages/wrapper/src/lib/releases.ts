import { Octokit } from "@octokit/rest"

export const DEFAULT_DIST_ASSET_NAME = "dist.zip"
export const DEFAULT_RELEASE_TAG_PREFIX = "rel-"

const DEFAULT_MAX_RELEASE_PAGES = 10
const RELEASES_PER_PAGE = 100

export interface GithubReleaseAsset {
	name: string
	browser_download_url: string
	size?: number
}

export interface GithubRelease {
	tag_name: string
	name: string | null
	html_url: string
	published_at: string | null
	prerelease: boolean
	draft: boolean
	assets: GithubReleaseAsset[]
}

export interface ReleaseWithAsset {
	release: GithubRelease
	asset: GithubReleaseAsset
}

export interface GetLatestReleaseOptions {
	repository: string
	assetName?: string
	tagPrefix?: string
	maxPages?: number
}

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
	request: {
		timeout: 15_000,
	},
})

function parseRepository(repository: string) {
	const [owner, repo, ...rest] = repository.split("/")

	if (!owner || !repo || rest.length > 0) {
		throw new Error(
			`Invalid repository "${repository}", expected "owner/repo"`,
		)
	}

	return { owner, repo }
}

/**
 * Finds the most recent release matching the expected tag prefix that
 * also includes the requested asset.
 */
export async function getLatestReleaseWithAsset({
	repository,
	assetName = DEFAULT_DIST_ASSET_NAME,
	tagPrefix = DEFAULT_RELEASE_TAG_PREFIX,
	maxPages = DEFAULT_MAX_RELEASE_PAGES,
}: GetLatestReleaseOptions): Promise<ReleaseWithAsset | null> {
	const { owner, repo } = parseRepository(repository)

	for (let page = 1; page <= maxPages; page++) {
		const { data } = await octokit.repos.listReleases({
			owner,
			repo,
			per_page: RELEASES_PER_PAGE,
			page,
		})

		for (const release of data) {
			if (release.draft || !release.tag_name.startsWith(tagPrefix)) {
				continue
			}

			const asset = release.assets.find(
				(candidate) => candidate.name === assetName,
			)

			if (!asset) {
				continue
			}

			return {
				release: {
					tag_name: release.tag_name,
					name: release.name,
					html_url: release.html_url,
					published_at: release.published_at,
					prerelease: release.prerelease,
					draft: release.draft,
					assets: release.assets.map((candidate) => ({
						name: candidate.name,
						browser_download_url: candidate.browser_download_url,
						size: candidate.size,
					})),
				},
				asset: {
					name: asset.name,
					browser_download_url: asset.browser_download_url,
					size: asset.size,
				},
			}
		}

		if (data.length < RELEASES_PER_PAGE) {
			break
		}
	}

	return null
}
