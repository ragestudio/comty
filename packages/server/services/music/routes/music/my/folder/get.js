import {
    TrackLike,
} from "@db_models"

import TrackClass from "@classes/track"

//
// A endpoint to fetch track & playlists & releases likes
//
export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const user_id = req.auth.session.user_id
        const { limit, offset } = req.query

        const [
            totalTrackLikes,
            totalReleasesLikes,
            totalPlaylistsLikes,
        ] = await Promise.all([
            TrackLike.countDocuments({ user_id }),
            0,
            0,
        ])

        let [
            trackLikes,
            releasesLikes,
            playlistsLikes
        ] = await Promise.all([
            TrackLike.find({
                user_id
            })
                .limit(limit)
                .skip(offset),
            [],
            [],
        ])

        let [
            Tracks,
            Releases,
            Playlists,
        ] = await Promise.all([
            TrackClass.get(trackLikes.map(trackLike => trackLike.track_id), {
                user_id,
                onlyList: true,
            }),
            [],
            [],
        ])

        Tracks = Tracks.sort((a, b) => b.liked_at - a.liked_at)
        // Releases = Releases.sort((a, b) => b.liked_at - a.liked_at)
        // Playlists = Playlists.sort((a, b) => b.liked_at - a.liked_at)

        return {
            tracks: {
                list: Tracks,
                total_items: totalTrackLikes,
            },
            releases: {
                list: Releases,
                total_items: totalReleasesLikes,
            },
            playlists: {
                list: Playlists,
                total_items: totalPlaylistsLikes,
            },
            total_length: totalTrackLikes + totalReleasesLikes + totalPlaylistsLikes,
        }
    }
}