import { MusicRelease, User } from "@db_models"

const AllowedUpdateFields = [
    "title",
    "cover",
    "album",
    "artist",
    "type",
    "public",
]

export default class Release {
    static async create(payload) {
        const release = new MusicRelease({
            user_id: payload.user_id,
            created_at: Date.now(),
            title: payload.title,
            cover: payload.cover,
            explicit: payload.explicit,
            type: payload.type,
            public: payload.public,
            items: payload.items,
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

        release = await MusicRelease.findByIdAndUpdate(id, release)

        return release
    }

    static async fullfillItemData(release) {
        
        return release
    }
}