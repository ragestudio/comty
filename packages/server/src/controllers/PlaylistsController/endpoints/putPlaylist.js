import { Schematized } from "@lib"

import { Playlist } from "@models"

import createOrUpdateTrack from "../../TracksController/services/createOrUpdateTrack"

export default {
    method: "PUT",
    route: "/",
    middlewares: ["withAuthentication"],
    fn: Schematized({
        required: ["title", "list"],
    }, async (req, res) => {
        if (!Array.isArray(req.body.list)) {
            return res.status(400).json({
                error: "list must be an array"
            })
        }

        let trackList = req.body.list

        trackList = await Promise.all(trackList.map(async (track) => {
            if (typeof track !== "object") {
                return track
            }

            track.user_id = req.user._id.toString()

            const result = await createOrUpdateTrack(track)

            if (result) {
                return result._id.toString()
            }
        }))

        let playlist = null

        // check if body._id exists, if it does, update the playlist
        // if it doesn't, create a new playlist
        if (req.body._id) {
            playlist = await Playlist.findById(req.body._id)

            if (!playlist) {
                return res.status(404).json({
                    error: "playlist not found"
                })
            }

            // check if req.user._id is the same as playlist.user_id
            if (playlist.user_id !== req.user._id.toString()) {
                return res.status(403).json({
                    error: "You don't have permission to edit this playlist"
                })
            }

            playlist.title = req.body.title
            playlist.description = req.body.description
            playlist.thumbnail = req.body.thumbnail
            playlist.explicit = req.body.explicit
            playlist.public = req.body.visibility ? req.body.visibility === "public" : true
            playlist.list = trackList

            playlist = await Playlist.findByIdAndUpdate(req.body._id, playlist)

            if (!playlist) {
                return res.status(500).json({
                    error: "An error occurred while updating the playlist"
                })
            }

            global.eventBus.emit(`playlist.${playlist._id}.updated`, playlist)
        } else {
            playlist = new Playlist({
                user_id: req.user._id.toString(),
                created_at: Date.now(),
                title: req.body.title ?? "Untitled",
                description: req.body.description,
                thumbnail: req.body.thumbnail,
                explicit: req.body.explicit,
                list: trackList,
            })

            await playlist.save()

            // TODO: use custom event
        }

        return res.json(playlist)
    })
}