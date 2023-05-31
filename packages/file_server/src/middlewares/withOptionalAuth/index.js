export default function (req, res, next) {
    // extract authentification header
    let auth = req.headers.authorization

    if (!auth) {
        return next()
    }

    auth = req.sessionToken = auth.replace("Bearer ", "")

    // check if authentification is valid
    comty.rest.session.validateToken(auth)
        .catch((error) => {
            return {
                valid: false,
            }
        })
        .then((validation) => {
            req.session = validation.session

            next()
        })
}