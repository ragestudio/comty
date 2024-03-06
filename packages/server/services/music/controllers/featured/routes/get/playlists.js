import { FeaturedPlaylist } from "@db_models"

export default async (req, res) => {
    const includeDisabled = req.query["include-disabled"] === "true"

    const query = {
        enabled: true
    }

    if (includeDisabled) {
        query.enabled = undefined
    }

    let playlists = await FeaturedPlaylist.find(query).catch((error) => {
        return []
    })

    return res.json(playlists)
}