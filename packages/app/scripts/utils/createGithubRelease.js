import axios from "axios"

export default async function createGithubRelease(repo, payload, token) {
	const { version, changelog } = payload

	const response = await axios({
		method: "post",
		url: `https://api.github.com/repos/${repo}/releases`,
		headers: {
			Authorization: `token ${token}`,
			"Content-Type": "application/json",
		},
		data: {
			tag_name: version,
			name: `v${version}`,
			body: changelog,
		},
	})

	console.log("⚒  Creating release done!")

	return response.data
}
