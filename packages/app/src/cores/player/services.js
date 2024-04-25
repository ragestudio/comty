import MusicModel from "comty.js/models/music"

export default {
    "default": {
        resolve: async (track_id) => {
            return await MusicModel.getTrackData(track_id)
        },
        resolveMany: async (track_ids, options) => {
            const response = await MusicModel.getTrackData(track_ids, options)

            if (response.list) {
                return response
            }

            return [response]
        },
        toggleLike: async (manifest, to) => {
            return await MusicModel.toggleTrackLike(manifest, to)
        }
    }
}