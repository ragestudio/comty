import AuthToken from "@shared-classes/AuthToken"
import { UserConfig, MFASession } from "@db_models"
import requiredFields from "@shared-utils/requiredFields"

import Account from "@classes/account"

export default async (req, res) => {
    requiredFields(["username", "password"], req.body)

    const user = await Account.loginStrategy({
        username: req.body.username,
        password: req.body.password,
    })

    const userConfig = await UserConfig.findOne({ user_id: user._id.toString() }).catch(() => {
        return {}
    })

    if (userConfig && userConfig.values) {
        if (userConfig.values.mfa_enabled) {
            let codeVerified = false

            // search if is already a mfa session
            let mfaSession = await MFASession.findOne({ user_id: user._id })

            if (mfaSession) {
                if (!req.body.mfa_code) {
                    await mfaSession.delete()
                } else {
                    if (mfaSession.expires_at < new Date().getTime()) {
                        await mfaSession.delete()

                        throw new OperationError(401, "MFA code expired, login again...")
                    }

                    if (mfaSession.code == req.body.mfa_code) {
                        codeVerified = true
                        await mfaSession.delete()
                    } else {
                        throw new OperationError(401, "Invalid MFA code, try again...")
                    }
                }
            }

            if (!codeVerified) {
                const mfa = {
                    type: "email",
                    user_id: user._id,

                    code: Math.floor(Math.random() * 9000) + 1000,

                    created_at: new Date().getTime(),
                    // expires in 1 hour
                    expires_at: new Date().getTime() + 60 * 60 * 1000,

                    ip_address: req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket?.remoteAddress ?? req.ip,
                    client: req.headers["user-agent"],
                }

                // create a new mfa session
                mfaSession = new MFASession(mfa)

                await mfaSession.save()

                ipc.invoke("ems", "mfa:send", mfa)

                return {
                    message: `MFA required, using [${mfa.type}] method.`,
                    mfa_required: true,
                }
            }
        }
    }

    const authData = {
        date: new Date().getTime(),
        username: user.username,
        user_id: user._id.toString(),
        ip_address: req.headers["x-forwarded-for"]?.split(",")[0] ?? req.socket?.remoteAddress ?? req.ip,
        client: req.headers["user-agent"],
    }

    const token = await AuthToken.createAuth(authData)

    // emit to ems to notify user for the new login, in the background
    try {
        global.ipc.call("ems", "new:login", authData).catch((error) => {
            // whoipsi dupsi
            console.error(error)
        })
    } catch (error) {
        // whoipsi dupsi
        console.error(error)
    }

    return { token: token }
}