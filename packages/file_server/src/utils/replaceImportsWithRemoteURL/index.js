import resolveUrl from "@utils/resolveUrl"

export default (code, rootURL) => {
    const importRegex = /import\s+(?:(?:([\w*\s{},]*)\s+from\s+)?["']([^"']*)["']|["']([^"']*)["'])/g

    // replaces all imports with absolute paths
    const absoluteImportCode = code.replace(importRegex, (match, p1, p2) => {
        let resolved = resolveUrl(rootURL, p2)

        if (!p1) {
            return `import "${resolved}"`
        }

        return `import ${p1} from "${resolved}"`
    })

    return absoluteImportCode
}