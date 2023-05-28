export default (from, to) => {
    const resolvedUrl = new URL(to, new URL(from, "resolve://"))

    if (resolvedUrl.protocol === "resolve:") {
        let { pathname, search, hash } = resolvedUrl

        if (to.includes("@")) {
            const fromUrl = new URL(from)
            const toUrl = new URL(to, fromUrl.origin)

            pathname = toUrl.pathname
            search = toUrl.search
            hash = toUrl.hash
        }

        return pathname + search + hash
    }

    return resolvedUrl.toString()
}