import { StreamingProfile } from "@db_models"

export default {
    method: "GET",
    route: "/profile/visibility",
    middlewares: ["withAuthentication"],
    fn: async (req, res) => {
        let { ids } = req.query

        if (typeof ids === "string") {
            ids = [ids]
        }

        let visibilities = await StreamingProfile.find({
            _id: { $in: ids }
        })

        visibilities = visibilities.map((visibility) => {
            return [visibility._id.toString(), visibility.options.private]
        })

        return res.json(visibilities)
    }
}