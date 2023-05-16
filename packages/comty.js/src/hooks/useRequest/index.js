import React from "react"

export default (method, ...args) => {
    if (typeof method !== "function") {
        throw new Error("useRequest: method must be a function")
    }

    const [loading, setLoading] = React.useState(true)
    const [result, setResult] = React.useState(null)
    const [error, setError] = React.useState(null)

    const makeRequest = (...newArgs) => {
        method(...newArgs)
            .then((data) => {
                setResult(data)
                setLoading(false)
            })
            .catch((err) => {
                setError(err)
                setLoading(false)
            })
    }

    React.useEffect(() => {
        makeRequest(...args)
    }, [])

    return [loading, result, error, (...newArgs) => {
        setLoading(true)
        makeRequest(...newArgs)
    }]
}