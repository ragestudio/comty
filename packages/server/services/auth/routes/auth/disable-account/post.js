import AccountClass from "@classes/account"
import { OperationLog } from "@db_models"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        const user_id = req.auth.session.user_id

        await OperationLog.create({
            user_id: user_id,
            type: "disable_account",
            date: Date.now()
        })

        return await AccountClass.disableAccount({ user_id })
    }
}