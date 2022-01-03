export default (schema = {}, fn) => {
    return async (req, res, next) => {
        // if is nullish
        req.body = req.body ?? {}
        req.query = req.query ?? {}
        
        if (schema.required) {
            if (Array.isArray(schema.required)) {
                const missingKeys = []
                const requiredKeys = Array.isArray(schema.required) ? schema.required : []

                for await (let key of requiredKeys) {
                    if (typeof req.body[key] === "undefined" && typeof req.query[key] === "undefined") {
                        req.selection[key] = req.body[key]
                        continue
                    }
                }

                if (missingKeys.length > 0) {
                    return res.status(400).json({ error: `Missing ${missingKeys}` })
                }
            } else {
                console.warn("[INVALID SCHEMA] schema.required is defined but is not an array")
            }
        }

        if (schema.select) {
            if (Array.isArray(schema.select)) {
                if (typeof req.selection !== "object") {
                    req.selection = {}
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
            } else {
                console.warn("[INVALID SCHEMA] schema.select is defined but is not an array")
            }
        }

        if (typeof fn === "function") {
            return await fn(req, res, next)
        }
    }
}