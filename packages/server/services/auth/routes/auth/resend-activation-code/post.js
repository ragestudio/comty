import Account from "@classes/account"

export default async (req, res) => {
    const { user_id } = req.body

    if (!user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    const activationObj = await Account.sendActivationCode(user_id)

    return {
        ok: true,
        event: activationObj.event,
        user_id: activationObj.user_id,
        date: activationObj.date,
    }
}