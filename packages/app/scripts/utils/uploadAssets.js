export default async function uploadAssets(octokit, repo, release, assets) {
	console.log("⚒  Uploading assets...")

	console.log(`ReleaseID: ${release.id}`)

	for await (const asset of assets) {
		console.log(`Uploading Asset: ${asset.name}`)

		await octokit.repos.uploadReleaseAsset({
			release_id: release.id,
			owner: repo.split("/")[0],
			repo: repo.split("/")[1],
			name: asset.name,
			data: asset.data,
		})
	}

	console.log("⚒  Uploading assets done!")

	return true
}
