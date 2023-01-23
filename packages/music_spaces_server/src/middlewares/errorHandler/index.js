export const errorHandler = (error, req, res, next) => {
    res.json({ error: error.message })
}

export default errorHandler