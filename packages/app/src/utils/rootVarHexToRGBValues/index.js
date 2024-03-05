export default (rootVar) => {
    const rootVarValue = getComputedStyle(document.documentElement).getPropertyValue(rootVar)

    let result = rootVarValue

    if (rootVarValue.startsWith("#")) {
        // Convert hex to rgb values
        const r = parseInt(rootVarValue.slice(1, 3), 16)
        const g = parseInt(rootVarValue.slice(3, 5), 16)
        const b = parseInt(rootVarValue.slice(5, 7), 16)

        result = `${r}, ${g}, ${b}`
    }

    return result
}