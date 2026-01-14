export default async function (url) {
	if (typeof url !== "string") {
		return null
	}

	const res = await fetch(url, {
		method: "HEAD",
	})

	const type = res.headers.get("Content-Type")

	return type
}
