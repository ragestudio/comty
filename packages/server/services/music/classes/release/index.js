import { MusicRelease, User } from "@db_models"

const AllowedUpdateFields = [
    "title",
    "cover",
    "album",
    "artist",
    "type",
    "public",
    "list",
]

export default class Release {
    static async create(payload) {
        console.log(payload)
        if (!payload.title) {
            throw new OperationError(400, "Release title is required")
        }

        if (!payload.list) {
            throw new OperationError(400, "Release list is required")
        }

        // ensure list is an array of strings with tracks ids only
        payload.list = payload.list.map((item) => {
            if (typeof item !== "string") {
                item = item._id
            }

            return item
        })

        const release = new MusicRelease({
            user_id: payload.user_id,
            created_at: Date.now(),
            title: payload.title,
            cover: payload.cover,
            explicit: payload.explicit,
            type: payload.type,
            public: payload.public,
            list: payload.list,
            public: payload.public,
        })

        await release.save()

        return release
    }

    static async update(id, payload) {
        let release = await MusicRelease.findById(id).catch((err) => {
            return false
        })

        if (!release) {
            throw new OperationError(404, "Release not found")
        }

        if (release.user_id !== payload.user_id) {
            throw new PermissionError(403, "You dont have permission to edit this release")
        }

        for (const field of AllowedUpdateFields) {
            if (payload[field]) {
                release[field] = payload[field]
            }
        }

        // ensure list is an array of strings with tracks ids only
        release.list = release.list.map((item) => {
            if (typeof item !== "string") {
                item = item._id
            }

            return item
        })

        release = await MusicRelease.findByIdAndUpdate(id, release)

        return release
    }

    static async fullfillItemData(release) {
        return release
    }
}