import { TrackLike, Track } from "@db_models"
import { AuthorizationError, NotFoundError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
    }

    const { track_id } = req.params

    const track = await Track.findById(track_id).catch((err) => {
        return null
    })

    if (!track) {
        return new NotFoundError(req, res, "Track not found")
    }

    let like = await TrackLike.findOne({
        track_id: track_id,
        user_id: req.session.user_id,
    })

    like = new TrackLike({
        track_id: track_id,
        user_id: req.session.user_id,
        created_at: new Date().getTime(),
    })

    await like.save()
    
    global.ws.io.emit("music:self:track:toggle:like", {
        track_id: track_id,
        user_id: req.session.user_id,
        action: "liked" ,
    })

    return res.status(200).json({
        message: "ok",
        action: "liked",
    })
}