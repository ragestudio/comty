import authorizeAccount from "../../utils/authorizeAccount.js"

export default {
	cmd: "auth",
	fn: async () => {
		await authorizeAccount()
	},
}
