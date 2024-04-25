import ReleaseClass from "@classes/release"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        if (req.body._id) {
            return await ReleaseClass.update(req.body._id, {
                ...req.body,
                user_id: req.auth.session.user_id,
            })
        } else {
            return await ReleaseClass.create({
                ...req.body,
                user_id: req.auth.session.user_id,
            })
        }
    }
}