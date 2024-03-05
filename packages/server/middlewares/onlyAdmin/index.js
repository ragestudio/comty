export default (req, res, next) => {
    if (!req.auth) {
        return res.status(401).json({ error: "No authenticated" })
    }

    if (!req.auth.user.roles.includes("admin")) {
        return res.status(403).json({ error: "To make this request it is necessary to have administrator permissions" })
    }

    next()
}