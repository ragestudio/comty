export default (schema = {}, fn) => {
    return async (req, res, next) => {
        if (typeof req.body === "undefined") {
            req.body = {}
        }
        if (typeof req.query === "undefined") {
            req.query = {}
        }

        if (typeof req.selection !== "object") {
            req.selection = {}
        }

        if (schema.required) {
            if (!Array.isArray(schema.required)) {
                console.warn("[INVALID SCHEMA] schema.required is defined but is not an array")
                return
            }

            const missingKeys = []
            const requiredKeys = Array.isArray(schema.required) ? schema.required : []

            for (let key of requiredKeys) {
                const value = req.body[key] || req.query[key]

                if (!value || typeof value === "undefined") {
                    missingKeys.push(key)
                    break
                }

                req.selection[key] = value
            }

            if (missingKeys.length > 0) {
                return res.status(400).json({
                    error: `Missing required keys > ${missingKeys}`,
                    missingKeys: missingKeys
                })
            }
        }

        if (schema.select) {
            if (!Array.isArray(schema.select)) {
                console.warn("[INVALID SCHEMA] schema.select is defined but is not an array")
                return
            }

            // assign objects along request body and query.
            for await (let key of schema.select) {
                if (req.body && typeof req.body[key] !== "undefined") {
                    req.selection[key] = req.body[key]
                    continue
                }

                if (req.query && typeof req.query[key] !== "undefined") {
                    req.selection[key] = req.query[key]
                    continue
                }
            }
        }

        if (typeof fn === "function") {
            return await fn(req, res, next)
        }
    }
}