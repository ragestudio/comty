import { Release } from "@shared-classes/DbModels"
import { AuthorizationError, PermissionError, NotFoundError } from "@shared-classes/Errors"
import RemoveTracks from "@services/removeTracks"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    let removedTracksIds = []

    const removeWithTracks = req.query.remove_with_tracks === "true"

    let release = await Release.findOne({
        _id: req.params.release_id,
    }).catch((err) => {
        return false
    })

    if (!release) {
        return new NotFoundError(req, res, "Release not found")
    }

    if (release.user_id !== req.session.user_id.toString()) {
        return new PermissionError(req, res, "You don't have permission to edit this release")
    }

    await Release.deleteOne({
        _id: req.params.release_id,
    })

    if (removeWithTracks) {
        removedTracksIds = await RemoveTracks(release.list)
    }

    return res.json({
        success: true,
        removedTracksIds,
    })
}