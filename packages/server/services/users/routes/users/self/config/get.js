import { UserConfig } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const key = req.query.key

        let config = await UserConfig.findOne({
            user_id: req.auth.session.user_id
        })

        if (!config) {
            config = await UserConfig.create({
                user_id: req.auth.session.user_id,
                values: {}
            })
        }

        if (key) {
            return config.values?.[key]
        }

        return config.values
    }
}