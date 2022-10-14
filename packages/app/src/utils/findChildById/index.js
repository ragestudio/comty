const findChildById = (element, id,) => {
    let returnElement = null
    let lastChildren = element.childNodes

    for (let index = 0; index < lastChildren.length; index++) {
        const child = lastChildren[index]

        if (child.id === id) {
            returnElement = child
            break
        }

        if (child.childNodes.length > 0) {
            returnElement = findChildById(child, id)
            if (returnElement) {
                break
            }
        }
    }

    return returnElement
}

export default findChildById