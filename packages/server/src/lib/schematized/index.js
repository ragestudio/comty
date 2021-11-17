export default (schema, fn) => {
    return async (req, res, next) => {
        const missingKeys = []
        const requiredKeys = Array.isArray(schema) ? schema : []

        for await (let key of requiredKeys) {
            if (typeof req.body[key] === "undefined") {
                missingKeys.push(key)
            }
        }

        if (missingKeys.length > 0) {
            return res.status(400).json({ error: `Missing required keys > ${missingKeys}` })
        } else {
            if (typeof fn === "function") {
                return await fn(req, res, next)
            }
        }
    }
}