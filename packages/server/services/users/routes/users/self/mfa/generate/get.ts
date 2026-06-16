import type API from "@services/users/users.service"

import qrcode from "qrcode"
import * as authenticator from "otplib"
import { generateTOTP } from "@otplib/uri"

import UserTotp from "@db_models/userTotp"
import { encrypt } from "@shared-utils/mfa"

export default defineRoute<API>()({
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		//@ts-ignore
		const user = await req.auth.user()
		//@ts-ignore
		const user_id = req.auth.user_id

		const secret = authenticator.generateSecret()
		const { encryptedText, iv, authTag } = encrypt(secret)

		await UserTotp.findOneAndUpdate(
			{ user_id },
			{
				encrypted_secret: encryptedText,
				iv,
				auth_tag: authTag,
				enabled: false,
			},
			{ upsert: true },
		)

		const otpauth = generateTOTP({
			issuer: "Comty",
			label: user.username,
			secret: secret,
		})
		const qrCodeUrl = await qrcode.toDataURL(otpauth)

		return {
			qrCodeUrl,
			secret,
		}
	},
})
