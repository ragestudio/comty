import { Playlist, UserFollow } from "@models"

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

    return playlists
}