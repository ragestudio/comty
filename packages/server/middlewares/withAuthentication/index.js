import { authorizedServerTokens } from "../../db_models"
import SecureEntry from "../../classes/SecureEntry"
import AuthToken from "../../classes/AuthToken"

export default async (req, res) => {
    function reject(data) {
        return res.status(401).json(data)
    }

    try {
        const tokenAuthHeader = req.headers?.authorization?.split(" ")

        if (!tokenAuthHeader) {
            return reject({
                error: "Missing token header"
            })
        }

        if (!tokenAuthHeader[1]) {
            return reject({
                error: "Recived header, missing token"
            })
        }

        switch (tokenAuthHeader[0]) {
            case "Bearer": {
                const token = tokenAuthHeader[1]

                const validation = await AuthToken.validate(token)

                if (!validation.valid) {
                    return reject(validation)
                }

                req.auth = {
                    token: token,
                    decoded: validation.data,
                    session: validation.session,
                    user: validation.user
                }

                return
            }
            case "Server": {
                const [client_id, token] = tokenAuthHeader[1].split(":")

                if (client_id === "undefined" || token === "undefined") {
                    return reject({
                        error: "Invalid server token"
                    })
                }

                const secureEntries = new SecureEntry(authorizedServerTokens)

                const serverTokenEntry = await secureEntries.get(client_id, undefined, {
                    keyName: "client_id",
                    valueName: "token",
                })

                if (!serverTokenEntry) {
                    return reject({
                        error: "Invalid server token"
                    })
                }

                if (serverTokenEntry !== token) {
                    return reject({
                        error: "Missmatching server token"
                    })
                }

                req.user = {
                    __server: true,
                    _id: client_id,
                    roles: ["server"],
                }

                return
            }
            default: {
                return reject({
                    error: "Invalid token type"
                })
            }
        }
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            error: "An error occurred meanwhile authenticating your token"
        })
    }
}
