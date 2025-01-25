export default async (req, res, next) => {
    if (!req.auth) {
        return res.status(401).json({ error: "No authenticated" })
    }

    req.auth.user = await req.auth.user()

    if (!req.auth.user.roles.includes("admin")) {
        return res.status(403).json({ error: "To make this request it is necessary to have administrator permissions" })
    }

    next()
}