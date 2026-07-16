export default class KlipyAPI {
	static base_url = "https://api.klipy.com/api/v1/"

	static gif = {
		search: async ({
			query,
			limit,
			page,
		}: {
			query: string
			limit?: number
			page?: number
		}) => {
			const url = new URL(
				`${process.env.KLIPY_TOKEN}/gifs/search`,
				KlipyAPI.base_url,
			)

			url.searchParams.set("q", query)
			url.searchParams.set("per_page", limit?.toString() ?? "10")
			url.searchParams.set("page", page?.toString() ?? "1")

			const res = await fetch(url)
			const jsonData = await res.json()

			return jsonData.data
		},
	}
}
