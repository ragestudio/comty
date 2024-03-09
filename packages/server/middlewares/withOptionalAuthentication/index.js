import withAuthentication from "../withAuthentication"

export default async (req, res, next) => {
    if (req.headers?.authorization) {
        await withAuthentication(req, res, next)
    }
}