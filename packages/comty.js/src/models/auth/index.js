import request from "../../handlers/request"
import SessionModel from "../session"

const emailRegex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)

export default class AuthModel {
    static login = async (payload) => {
        const response = await request({
            method: "post",
            url: "/auth/login",
            data: {
                username: payload.username, //window.btoa(payload.username),
                password: payload.password, //window.btoa(payload.password),
            },
        })

        SessionModel.token = response.data.token

        __comty_shared_state.eventBus.emit("auth:login_success")

        return response.data
    }

    static logout = async () => {
        await SessionModel.destroyCurrentSession()

        SessionModel.removeToken()

        __comty_shared_state.eventBus.emit("auth:logout_success")
    }

    static register = async (payload) => {
        const { username, password, email } = payload

        const response = await request({
            method: "post",
            url: "/auth/register",
            data: {
                username,
                password,
                email,
            }
        }).catch((error) => {
            console.error(error)

            return false
        })

        if (!response) {
            throw new Error("Unable to register user")
        }

        return response
    }

    static usernameValidation = async (username) => {
        let payload = {}

        // check if usename arguemnt is an email
        if (emailRegex.test(username)) {
            payload.email = username
        } else {
            payload.username = username
        }

        const response = await request({
            method: "get",
            url: "/auth/login/validation",
            params: payload,
        }).catch((error) => {
            console.error(error)

            return false
        })

        if (!response) {
            throw new Error("Unable to validate user")
        }

        return response.data
    }
}