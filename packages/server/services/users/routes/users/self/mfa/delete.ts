import type API from "@services/users/users.service"

import * as authenticator from "otplib"
import { decrypt } from "@shared-utils/mfa"

import UserTotp from "@db_models/userTotp"
import User from "@db_models/user"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		//@ts-ignore
		const user_id = req.auth.session.user_id
		const { code } = req.body

		const userTotp = await UserTotp.findOne({ user_id })

		if (!userTotp) {
			throw new OperationError(404, "MFA is not enabled")
		}

		if (userTotp.enabled) {
			if (!code) {
				throw new OperationError(
					400,
					"MFA code is required to disable 2FA",
				)
			}

			const secret = decrypt(
				userTotp.encrypted_secret,
				userTotp.iv,
				userTotp.auth_tag,
			)

			const { valid: isValid } = await authenticator.verify({
				secret: secret,
				token: code,
			})

			if (!isValid) {
				throw new OperationError(401, "Invalid MFA code")
			}
		}

		await UserTotp.deleteOne({ user_id })

		// Remove has_totp flag from user
		await User.updateOne({ _id: user_id }, { $pull: { flags: "has_totp" } })

		return {
			success: true,
			message: "TOTP 2FA disabled successfully",
		}
	},
})
