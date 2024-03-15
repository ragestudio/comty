import LimitsClass from "@shared-classes/Limits"

export default async (req) => {
    const key = req.query.key

    return await LimitsClass.get(key)
}