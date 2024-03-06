import Account from "@classes/account"

export default async (req) => {
    const result = await Account.create(req.body)

    return result
}