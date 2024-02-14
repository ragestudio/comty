import request from "../../../handlers/request"

export default class VRCService {
    static base_api_hostname = "https://api.vrchat.cloud/api/1"

    static get sync_interface() {
        return globalThis.__comty_shared_state.instances["sync"]
    }

    static get vrc_interface() {
        return globalThis.__comty_shared_state.instances["vrc"]
    }

    /**
     * Retrieves the current session data if it exists.
     *
     * @return {Promise<Object>} The session data.
     */
    static async get_session() {
        const response = await request({
            instance: VRCService.sync_interface,
            method: "GET",
            url: "/services/vrc/session",
        })

        return response.data
    }

    /**
     * Authenticates the user with the provided username and password.
     * This will store the session data in the server.
     *
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @return {Promise<Object>} A promise that resolves to the data returned by the authentication API.
     */
    static async auth(username, password, onOtpRequired) {
        let response = null

        const makeRequest = async () => {
            response = await request({
                instance: VRCService.sync_interface,
                method: "POST",
                url: "/services/vrc/auth",
                data: {
                    username,
                    password,
                },
            })

            if (response.data.requiresTwoFactorAuth) {
                if (typeof onOtpRequired !== "function") {
                    throw new Error("2FA is required, but no (onOtpRequired) was provided")
                }

                console.log(`2FA Required, invoking onOtpRequired`)

                return await makeOTPRequest()
            }

            return response.data
        }

        const makeOTPRequest = async () => {
            const otpType = response.data.requiresTwoFactorAuth[0]

            const otpInput = await onOtpRequired(otpType)

            console.log(`OTP Result = ${otpInput}`)

            if (!otpInput) {
                console.error("OTP input was empty, requesting again")

                return await makeOTPRequest()
            }

            const otpResponse = await request({
                instance: VRCService.sync_interface,
                method: "POST",
                url: "/services/vrc/otp",
                data: {
                    type: otpType,
                    code: otpInput,
                },
            }).catch((err) => {
                console.error(err)

                return {
                    verified: false,
                }
            })

            console.log(`OTP Response >`, otpResponse.data)

            if (otpResponse.data.verified) {
                console.log("OTP Verified")
                return await makeRequest()
            } else {
                console.log("OTP Failed")
                return await makeOTPRequest()
            }
        }

        return await makeRequest()
    }

    /**
     * Logout the current stored session from the server.
     *
     * @return {Promise<Object>} A Promise that resolves to the response data from the logout request.
     */
    static async logout() {
        const response = await request({
            instance: VRCService.sync_interface,
            method: "POST",
            url: "/services/vrc/logout",
        })

        return response.data
    }
}