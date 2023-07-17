import { Token } from "@lib"

export default async (expiredToken) => {
    let regenerationToken = null

    // check if this expired token has a regeneration token associated
    const associatedRegenerationToken = await Token.getRegenerationToken(expiredToken)

    if (associatedRegenerationToken) {
        regenerationToken = associatedRegenerationToken.refreshToken
    } else {
        // create a new regeneration token with the expired token
        regenerationToken = await Token.createNewRegenerationToken(expiredToken)
    }

    return regenerationToken.refreshToken
}