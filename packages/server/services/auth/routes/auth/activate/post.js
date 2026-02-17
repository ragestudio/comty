import Account from "@classes/account"

export default async (req) => {
	return await Account.activateAccount(req.body)
}
