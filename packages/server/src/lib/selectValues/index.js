export default (query = [], fn) => {
    return async (req, res, next) => {
        if (typeof fn === "function") {
            const obj = {}

            if (!req.body) {
                req.body = {}
            }
            if (!req.query) {
                req.query = {}
            }
            
            if (Array.isArray(query)) {
                query.forEach(key => {
                    const value = req.body[key] ?? req.query[key]
                    if (typeof value !== "undefined") {
                        obj[key] = value
                    }
                })
            }

            req.selectedValues = obj
                
            return await fn(req, res, next)
        }
    }
}