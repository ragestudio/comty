export type AuthEndpointResult = {
	expiresIn?: string
	refreshToken?: string
	token?: string
	user_id?: string

	activation_required?: boolean

	mfa_required?:
		| false
		| {
				method: "totp" | "email"
				sended_to?: string
		  }
}
