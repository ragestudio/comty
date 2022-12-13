import { User, Playlist, UserFollow } from "../../../models"

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

    let playlists = await Playlist.find({
        user_id: { $in: fetchFromUserIds }
    })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)

    playlists = await Promise.all(playlists.map(async (playlist) => {
        // get user data
        const user = await User.findById(playlist.user_id)

        return {
            ...playlist.toObject(),
            user: {
                username: user.username,
                avatar: user.avatar,
            },
        }
    }))

    return playlists
}