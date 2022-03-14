export default (req, res, next) => {
    if (!req.user.roles.includes("admin")) {
        return res.status(403).send({ error: "To make this request it is necessary to have administrator permissions" })
    }

    next()
}