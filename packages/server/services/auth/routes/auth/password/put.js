import Account from "@classes/account"
import requiredFields from "@shared-utils/requiredFields"

export default {
	//middlewares: ["withAuthentication"],
	fn: async (req) => {
		requiredFields(["new_password"], req.body)

		await Account.changePassword(
			{
				user_id: req.auth?.session?.user_id ?? null,
				old_password: req.body.old_password,
				new_password: req.body.new_password,
				verificationToken: req.body.verificationToken,
				code: req.body.code,
				log_comment: "Changed from password change request",
			},
			req,
		)

		return {
			message: "Password changed",
		}
	},
}
