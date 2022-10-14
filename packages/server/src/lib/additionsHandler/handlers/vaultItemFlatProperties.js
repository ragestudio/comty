export default (obj) => {
    return {
        ...obj,
        ...obj.properties,
    }
}