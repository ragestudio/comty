export default async function (req, res, next) {
    // extract authentification header
    let auth = req.headers.authorization

    if (!auth) {
        return false
    }

    auth = auth.replace("Bearer ", "")

    // check if authentification is valid
    const validation = await comty.rest.session.validateToken(auth).catch((error) => {
        return {
            valid: false,
        }
    })

    if (!validation.valid) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    req.session = validation.session

    return true
}