import SecureEntry from "@lib/secureEntry"
import { authorizedServerTokens } from "@models"

const rootClientID = "00000000-0000-0000-000000000000"

export default async () => {
    // check if process.env.SERVER_TOKEN is included in authorizedServerKeys
    if (process.env.SERVER_TOKEN) {
        console.log("Checking if server token is authorized on server tokens list...")

        const secureEntries = new SecureEntry(authorizedServerTokens)

        const currentServerToken = await secureEntries.get(rootClientID, undefined, {
            keyName: "client_id",
        })

        // check if match or not exist, if not, update
        if (currentServerToken !== process.env.SERVER_TOKEN) {
            console.log("Server token is not authorized on server tokens list, updating...")

            await secureEntries.set(rootClientID, process.env.SERVER_TOKEN, {
                keyName: "client_id",
                valueName: "token",
            })
        }

        return true
    }
}