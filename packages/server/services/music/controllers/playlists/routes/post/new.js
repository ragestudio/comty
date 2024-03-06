import { Playlist } from "@db_models"
import { AuthorizationError } from "@shared-classes/Errors"

export default async (req, res) => {
    if (!req.session) {
        return new AuthorizationError(req, res)
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

    let playlist = await Playlist.findOne({
        title: req.body.title,
        user_id: req.session.user_id.toString(),
    })

    if (playlist) {
        return res.status(400).json({
            message: "Playlist already exists",
        })
    }

    playlist = new Playlist({
        user_id: req.session.user_id.toString(),
        created_at: Date.now(),
        title: req.body.title ?? "Untitled",
        description: req.body.description,
        cover: req.body.cover,
        explicit: req.body.explicit,
        public: req.body.public,
        list: req.body.list ?? [],
        public: req.body.public,
    })

    await playlist.save()

    return res.json(playlist)
}