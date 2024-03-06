import { User, APRSession } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"

import Account from "@classes/account"

export default async (req) => {
    requiredFields(["new_password"], req.body)

    const { apr_code } = req.params

    const apr = await APRSession.findOne({ code: apr_code })

    if (!apr) {
        throw new OperationError(400, "Request not found")
    }

    if (apr.expires_at < new Date().getTime()) {
        throw new OperationError(400, "Request expired")
    }

    if (apr.status !== "sended") {
        throw new OperationError(400, "Request already completed")
    }

    const user = await User.findById(apr.user_id).select("+password")

    await Account.changePassword(
        {
            user_id: apr.user_id,
            old_hash: user.password,
            new_password: req.body.new_password,
            log_comment: "Changed from APR request"
        },
        req,
    )

    apr.status = "completed"
    apr.completed_at = Date.now()

    await apr.save()

    return {
        message: "Password changed",
    }
}