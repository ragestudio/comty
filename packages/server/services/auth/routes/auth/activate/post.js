import Account from "@classes/account"

export default async (req, res) => {
    return await Account.activateAccount(req.body)
}