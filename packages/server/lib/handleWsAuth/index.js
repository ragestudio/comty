import AuthToken from "../../classes/AuthToken"
import { User } from "../../db_models"

export default async (socket, token, err) => {
    try {
        const validation = await AuthToken.validate(token)

        if (!validation.valid) {
            if (validation.error) {
                return err(`auth:server_error`)
            }

            return err(`auth:token_invalid`)
        }

        const userData = await User.findById(validation.data.user_id).catch((err) => {
            console.error(`[${socket.id}] failed to get user data caused by server error`, err)

            return null
        })

        if (!userData) {
            return err(`auth:user_failed`)
        }

        socket.userData = userData
        socket.token = token
        socket.session = validation.data

        return {
            token: token,
            username: userData.username,
            user_id: userData._id,
        }
    } catch (error) {
        return err(`auth:authentification_failed`, error)
    }
}