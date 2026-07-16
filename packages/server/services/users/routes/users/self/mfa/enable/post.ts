import type API from "@services/users/users.service"

import * as authenticator from "otplib"
import { decrypt } from "@shared-utils/mfa"

import UserConfig from "@db_models/userConfig"
import UserTotp from "@db_models/userTotp"
import User from "@db_models/user"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		//@ts-ignore
		const user_id = req.auth.session.user_id
		const { code } = req.body

		if (!code) {
			throw new OperationError(400, "MFA code is required")
		}

		const userTotp = await UserTotp.findOne({ user_id })

		if (!userTotp) {
			throw new OperationError(
				404,
				"MFA setup not found. Generate first.",
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

		userTotp.enabled = true
		await userTotp.save()

		// Add has_totp flag to user
		await User.updateOne(
			{ _id: user_id },
			{ $addToSet: { flags: "has_totp" } },
		)

		await UserConfig.updateOne(
			{ user_id: user_id },
			{
				$set: {
					values: { "auth:2fa-type": "totp" },
				},
			},
			{ upsert: true },
		)

		return {
			success: true,
			message: "TOTP 2FA enabled successfully",
		}
	},
})
