import { LoginStage, LoginContext } from "../processor"
import { decrypt } from "@shared-utils/mfa"
import obscureEmail from "@shared-utils/obscureEmail"
import * as authenticator from "otplib"

import UserConfig from "@db_models/userConfig"
import UserTotp from "@db_models/userTotp"
import MFASession from "@db_models/mfaSessions"

export default class MFAStage extends LoginStage {
	async execute(context: LoginContext): Promise<void> {
		const { user, payload, request } = context
		const user_id = user._id.toString()

		const userConfig = await UserConfig.findOne({ user_id }).lean()
		const userTotp = await UserTotp.findOne({ user_id, enabled: true })

		const mfaEnabled = userTotp || userConfig?.values?.["auth:mfa"]

		if (!mfaEnabled) return

		// 1. Check if MFA code is provided
		if (payload.mfa_code) {
			const verified = await this.verifyCode(
				user,
				payload.mfa_code,
				userTotp,
			)
			if (verified) return

			throw new OperationError(401, "Invalid MFA code, try again...")
		}

		// 2. No code provided, trigger MFA challenge
		if (userTotp) {
			context.result = {
				message: "MFA required, using [totp] method.",
				method: "totp",
				mfa_required: true,
			}
		} else {
			const mfaData = await this.createEmailMFASession(user, request)
			context.result = {
				message: `MFA required, using [email] method.`,
				method: "email",
				sended_to: obscureEmail(user.email),
				mfa_required: true,
			}
		}

		context.isFinished = true
	}

	private async verifyCode(user, code, userTotp): Promise<boolean> {
		if (userTotp) {
			const secret = decrypt(
				userTotp.encrypted_secret,
				userTotp.iv,
				userTotp.auth_tag,
			)
			const { valid } = await authenticator.verify({
				secret,
				token: code,
			})
			return valid
		}

		// Email MFA
		const mfaSession = await MFASession.findOne({
			user_id: user._id.toString(),
			code: code,
		})

		if (mfaSession && mfaSession.expires_at > new Date().getTime()) {
			await MFASession.deleteMany({ user_id: user._id.toString() })
			return true
		}

		return false
	}

	private async createEmailMFASession(user, req) {
		const currentTime = new Date().getTime()
		const mfa = {
			type: "email",
			user_id: user._id,
			code: Math.floor(Math.random() * 9000) + 1000,
			created_at: currentTime,
			expires_at: currentTime + 60 * 60 * 1000,
			ip_address:
				req.headers["x-forwarded-for"] ??
				req.socket?.remoteAddress ??
				req.ip,
			client: req.headers["user-agent"],
		}

		await new MFASession(mfa).save()
		ipc.invoke("ems", "mfa:send", mfa)
		return mfa
	}
}
