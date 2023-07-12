import { User, Playlist, Track } from "@shared-classes/DbModels"
import pmap from "p-map"

export default {
    method: "GET",
    route: "/",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        const { keywords = "" } = req.query

        let suggestions = {}

        const searchers = [
            {
                id: "users",
                model: User,
                query: {
                    $or: [
                        { username: { $regex: keywords, $options: "i" } },
                        { fullName: { $regex: keywords, $options: "i" } },
                    ]
                },
                limit: 5,
                select: "username fullName avatar verified",
            },
            {
                id: "playlists",
                model: Playlist,
                query: {
                    $or: [
                        { title: { $regex: keywords, $options: "i" } },
                    ]
                },
                limit: 5,
            },
            {
                id: "tracks",
                model: Track,
                query: {
                    $or: [
                        { title: { $regex: keywords, $options: "i" } },
                        { author: { $regex: keywords, $options: "i" } },
                        { album: { $regex: keywords, $options: "i" } },
                    ]
                },
                limit: 5,
            }
        ]

        await pmap(
            searchers,
            async (searcher) => {
                let results = await searcher.model.find(searcher.query)
                    .limit(searcher.limit ?? 5)
                    .select(searcher.select ?? undefined)

                if (results.length > 0) {
                    suggestions[searcher.id] = results
                }

                return
            },
            {
                concurrency: 3
            }
        )

        return res.json(suggestions)
    }
}