import SessionModel from "../session"

export default class AuthModel {
    static login = async (payload) => {
        const response = await app.cores.api.customRequest( {
            method: "post",
            url: "/auth/login",
            data: {
                username: payload.username, //window.btoa(payload.username),
                password: payload.password, //window.btoa(payload.password),
            },
        })

        SessionModel.token = response.data.token

        app.eventBus.emit("auth:login_success")

        return response.data
    }

    static logout = async () => {
        await SessionModel.destroyCurrentSession()

        SessionModel.removeToken()

        app.eventBus.emit("auth:logout_success")
    }

    static async register(payload) {
        const { username, password, email } = payload

        const response = await User.bridge.post.register(undefined, {
            username,
            password,
            email,
        }).catch((error) => {
            console.error(error)

            return false
        })

        if (!response) {
            throw new Error("Unable to register user")
        }

        return response
    }
}