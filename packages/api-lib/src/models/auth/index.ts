import Model from "../../model"

export class Auth extends Model {
	async login(usernameOrEmail: string, password: string, code?: string) {
		const response = await this.request({
			method: "POST",
			url: "/auth",
			data: {
				username: usernameOrEmail,
				password: password,
				mfa_code: code,
			},
		})

		return response.data
	}
}

export default new Auth()
