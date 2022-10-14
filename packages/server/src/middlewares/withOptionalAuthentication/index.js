import withAuthentication from "../withAuthentication"

export default (req, res, next) => {
    if (req.headers?.authorization) {
        withAuthentication(req, res, next)
    } else {
        next()
    }
}