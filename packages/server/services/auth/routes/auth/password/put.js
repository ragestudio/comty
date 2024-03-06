import Account from "@classes/account"
import requiredFields from "@shared-utils/requiredFields"

export default {
    middlewares: ["withAuthentication"],
    fn: async (req) => {
        requiredFields(["old_password", "new_password"], req.body)

        await Account.changePassword(
            {
                user_id: req.auth.session.user_id,
                old_password: req.body.old_password,
                new_password: req.body.new_password,
                log_comment: "Changed from password change request"
            },
            req
        )

        return {
            message: "Password changed"
        }
    }
}