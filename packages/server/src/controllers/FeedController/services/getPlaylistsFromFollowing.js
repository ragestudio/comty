import { Playlist, User, UserFollow } from "@models"

export default async (payload) => {
    const {
        for_user_id,
        limit = 20,
        skip = 0,
    } = payload

    // get post from users that the user follows
    const followingUsers = await UserFollow.find({
        user_id: for_user_id
    })

    const followingUserIds = followingUsers.map((followingUser) => followingUser.to)

    const fetchFromUserIds = [
        for_user_id,
        ...followingUserIds,
    ]

    // firter out the playlists that are not public
    let playlists = await Playlist.find({
        user_id: { $in: fetchFromUserIds },
        $or: [
            { public: true },
        ]
    })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)

    playlists = Promise.all(playlists.map(async (playlist) => {
        playlist = playlist.toObject()

        playlist.type = "playlist"

        playlist.user = await User.findOne({
            _id: playlist.user_id,
        }).catch((err) => {
            return {
                username: "Unknown user",
            }
        })

        return playlist
    }))

    return playlists
}