import { Release, Track } from "@db_models"
import { AuthorizationError, NotFoundError, PermissionError, BadRequestError } from "@shared-classes/Errors"
import axios from "axios"

const AllowedUpdateFields = [
    "title",
    "cover",
    "album",
    "artist",
    "type",
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

async function fetchTrackSourceMetadata(track) {
    // get headers of source url (X-Amz-Meta-Duration)
    const response = await axios({
        method: "HEAD",
        url: track.source,
    }).catch((err) => {
        return {
            data: null,
            headers: null,
        }
    })

    if (response.headers) {
        return {
            duration: response.headers["x-amz-meta-duration"],
            size: response.headers["content-length"],
            bitrate: response.headers["x-amz-meta-bitrate"],
        }
    }

    return null
}

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

    if (!track.metadata) {
        track.metadata = await fetchTrackSourceMetadata(track)

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

    let release = null

    if (!req.body._id) {
        release = new Release({
            user_id: req.session.user_id.toString(),
            created_at: Date.now(),
            title: req.body.title ?? "Untitled",
            cover: req.body.cover,
            explicit: req.body.explicit,
            type: req.body.type,
            public: req.body.public,
            list: req.body.list,
            public: req.body.public,
        })

        await release.save()
    } else {
        release = await Release.findById(req.body._id)
    }

    if (!release) {
        return new NotFoundError(req, res, "Release not found")
    }

    if (release.user_id !== req.session.user_id.toString()) {
        return new PermissionError(req, res, "You don't have permission to edit this release")
    }

    release = release.toObject()

    release.publisher = {
        user_id: req.session.user_id.toString(),
        fullName: userData.fullName,
        username: userData.username,
        avatar: userData.avatar,
    }

    release.list = await Promise.all(req.body.list.map(async (track, index) => {
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

    AllowedUpdateFields.forEach((field) => {
        if (typeof req.body[field] !== "undefined") {
            release[field] = req.body[field]
        }
    })

    release = await Release.findByIdAndUpdate(release._id.toString(), release)

    if (!release) {
        return new NotFoundError(req, res, "Release not updated")
    }

    global.eventBus.emit(`release.${release._id}.updated`, release)

    return res.json(release)
}