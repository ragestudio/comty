import * as prompts from "@inquirer/prompts"
import AuthModel from "comty.js/dist/models/auth/index.js"

export default function authorizeAccount() {
	return new Promise(async (resolve, reject) => {
		const username = await prompts.input({
			message: "username or email >",
		})

		const password = await prompts.password({
			message: "password >",
		})

		try {
			const result = await AuthModel.default.login({ username, password })
			console.log("✅ Logged in successfully")

			await global.config.set("auth", result)
			resolve(result)
		} catch (error) {
			console.error(`⛔ Failed to login: ${error.response.data.error}`)
			authorizeAccount()
		}
	})
}
