import { StreamingProfile } from "@models"

export default async (profile = {}) => {
    if (!profile.user_id) {
        throw new Error("Invalid request, missing user_id")
    }

    if (!profile.profile_name) {
        throw new Error("Invalid request, missing profile_name")
    }

    const newProfile = new StreamingProfile({
        user_id: profile.user_id,
        profile_name: profile.profile_name,
        stream_key: global.nanoid(),
        info: {
            title: "Untitled",
            description: "No description",
            category: "other",
            thumbnail: null,
            ...profile.info,
        }
    })

    await newProfile.save()

    return newProfile
}