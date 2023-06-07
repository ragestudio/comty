import { Playlist, Track } from "@models"
import { AuthorizationError, NotFoundError, PermissionError, BadRequestError } from "@shared-classes/Errors"

const PlaylistAllowedUpdateFields = [
    "title",
    "cover",
    "album",
    "artist",
    "description",
    "public",
]

const TrackAllowedUpdateFields = [
    "title",
    "album",
    "artist",
    "cover",
    "explicit",
    "metadata",
    "public",
    "spotifyId",
    "lyricsEnabled",
    "public",
]

async function createOrUpdateTrack(payload) {
    if (!payload.title || !payload.source || !payload.publisher) {
        throw new Error("title and source and publisher are required")
    }

    let track = null

    if (payload._id) {
        track = await Track.findById(payload._id)

        if (!track) {
            throw new Error("track not found")
        }

        TrackAllowedUpdateFields.forEach((field) => {
            if (typeof payload[field] !== "undefined") {
                track[field] = payload[field]
            }
        })

        track = await Track.findByIdAndUpdate(payload._id, track)

        if (!track) {
            throw new Error("Failed to update track")
        }
    } else {
        track = new Track(payload)

        await track.save()
    }

    return track
}

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    if (!req.body.title || !req.body.list) {
        return new BadRequestError(req, res, "title and list are required")
    }

    if (!Array.isArray(req.body.list)) {
        return new BadRequestError(req, res, "list must be an array")
    }

    const userData = await global.comty.rest.user.data({
        user_id: req.session.user_id.toString(),
    })
        .catch((err) => {
            console.log("err", err)
            return false
        })

    if (!userData) {
        return new AuthorizationError(req, res)
    }

    let playlist = null

    if (!req.body._id) {
        playlist = new Playlist({
            user_id: req.session.user_id.toString(),
            created_at: Date.now(),
            title: req.body.title ?? "Untitled",
            description: req.body.description,
            cover: req.body.cover,
            explicit: req.body.explicit,
            public: req.body.public,
            list: req.body.list,
            public: req.body.public,
        })

        await playlist.save()
    } else {
        playlist = await Playlist.findById(req.body._id)
    }

    if (!playlist) {
        return new NotFoundError(req, res, "Playlist not found")
    }

    if (playlist.user_id !== req.session.user_id.toString()) {
        return new PermissionError(req, res, "You don't have permission to edit this playlist")
    }

    playlist = playlist.toObject()

    playlist.publisher = {
        user_id: req.session.user_id.toString(),
        fullName: userData.fullName,
        username: userData.username,
        avatar: userData.avatar,
    }

    playlist.list = await Promise.all(req.body.list.map(async (track, index) => {
        if (typeof track !== "object") {
            return track
        }

        track.publisher = {
            user_id: req.session.user_id.toString(),
            username: userData.username,
            avatar: userData.avatar,
            ...track.publisher ?? {},
        }

        const result = await createOrUpdateTrack(track)

        if (result) {
            return result._id.toString()
        }
    }))

    PlaylistAllowedUpdateFields.forEach((field) => {
        if (typeof req.body[field] !== "undefined") {
            playlist[field] = req.body[field]
        }
    })

    playlist = await Playlist.findByIdAndUpdate(playlist._id.toString(), playlist)

    if (!playlist) {
        return new NotFoundError(req, res, "Playlist not updated")
    }

    global.eventBus.emit(`playlist.${playlist._id}.updated`, playlist)

    return res.json(playlist)
}